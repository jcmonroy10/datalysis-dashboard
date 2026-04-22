-- =============================================================
-- Datalysis ETL — schema.sql
-- Pipeline: raw → clean → gold
--
-- Requiere que los CSVs estén en /data/:
--   orders.csv, products.csv, order_items.csv,
--   order_payments.csv, customers.csv
--
-- Ejecutar con:
--   psql -U postgres -d datalysis -f schema.sql
-- =============================================================


-- -------------------------------------------------------------
-- SCHEMAS
-- -------------------------------------------------------------

CREATE SCHEMA raw;
CREATE SCHEMA clean;
CREATE SCHEMA gold;


-- =============================================================
-- STAGE 1 — RAW (carga directa desde CSV, sin transformación)
-- =============================================================

CREATE TABLE raw.orders (
  order_id                        TEXT,
  customer_id                     TEXT,
  order_status                    TEXT,
  order_purchase_timestamp        TIMESTAMP,
  order_approved_at               TIMESTAMP,
  order_delivered_carrier_date    TIMESTAMP,
  order_delivered_customer_date   TIMESTAMP,
  order_estimated_delivery_date   TIMESTAMP
);
COPY raw.orders
FROM '/data/orders.csv'
DELIMITER ',' CSV HEADER;

CREATE TABLE raw.products (
  product_id                  TEXT,
  product_category_name       TEXT,
  product_name_lenght         INT,
  product_description_lenght  INT,
  product_photos_qty          INT,
  product_weight_g            INT,
  product_length_cm           INT,
  product_height_cm           INT,
  product_width_cm            INT
);
COPY raw.products
FROM '/data/products.csv'
DELIMITER ',' CSV HEADER;

CREATE TABLE raw.order_items (
  order_id            TEXT,
  order_item_id       INT,
  product_id          TEXT,
  seller_id           TEXT,
  shipping_limit_date TIMESTAMP,
  price               NUMERIC,
  freight_value       NUMERIC
);
COPY raw.order_items
FROM '/data/order_items.csv'
DELIMITER ',' CSV HEADER;

CREATE TABLE raw.order_payments (
  order_id              TEXT,
  payment_sequential    INT,
  payment_type          TEXT,
  payment_installments  INT,
  payment_value         NUMERIC
);
COPY raw.order_payments
FROM '/data/order_payments.csv'
DELIMITER ',' CSV HEADER;

CREATE TABLE raw.customers (
  customer_id             TEXT,
  customer_unique_id      TEXT,
  customer_zip_code_prefix INT,
  customer_city           TEXT,
  customer_state          TEXT
);
COPY raw.customers
FROM '/data/customers.csv'
DELIMITER ',' CSV HEADER;


-- =============================================================
-- STAGE 2 — CLEAN
-- Reglas aplicadas:
--   - Se eliminan columnas no utilizadas en el modelo
--   - order_purchase_timestamp se castea a DATE como order_date
--   - order_payments se mantiene a nivel item (se agrega en gold)
--   - Se conserva solo product_id + product_category_name
-- =============================================================

CREATE TABLE clean.orders AS
SELECT
  order_id,
  customer_id,
  order_status,
  order_purchase_timestamp::DATE        AS order_date,
  order_purchase_timestamp,
  order_delivered_customer_date,
  order_estimated_delivery_date
FROM raw.orders;

CREATE TABLE clean.order_items AS
SELECT
  order_id,
  order_item_id,
  product_id,
  price,
  freight_value
FROM raw.order_items;

-- Pagos aún a nivel raw (múltiples filas por orden)
-- La agregación se hace en gold.fact_sales
CREATE TABLE clean.order_payments AS
SELECT
  order_id,
  payment_value
FROM raw.order_payments;

CREATE TABLE clean.customers AS
SELECT
  customer_id,
  customer_state,
  customer_city
FROM raw.customers;

CREATE TABLE clean.products AS
SELECT
  product_id,
  product_category_name
FROM raw.products;


-- =============================================================
-- STAGE 3 — GOLD (star schema)
-- Grain de fact_sales: 1 fila por order_item (order_id + order_item_id)
-- =============================================================

-- Dimensión fecha (calendario completo del rango de órdenes)
CREATE TABLE gold.dim_date AS
WITH date_range AS (
  SELECT generate_series(
    (SELECT MIN(order_purchase_timestamp::date) FROM clean.orders),
    (SELECT MAX(order_purchase_timestamp::date) FROM clean.orders),
    interval '1 day'
  )::date AS date
)
SELECT
  date,
  EXTRACT(YEAR  FROM date)                                          AS year,
  EXTRACT(MONTH FROM date)                                          AS month,
  EXTRACT(DAY   FROM date)                                          AS day,
  EXTRACT(DOW   FROM date)                                          AS weekday,
  EXTRACT(WEEK  FROM date)                                          AS week_of_year,
  CASE WHEN EXTRACT(DOW FROM date) IN (0,6) THEN true ELSE false END AS is_weekend
FROM date_range;

CREATE TABLE gold.dim_customer AS
SELECT DISTINCT
  customer_id,
  customer_state,
  customer_city
FROM clean.customers;

CREATE TABLE gold.dim_product AS
SELECT DISTINCT
  product_id,
  product_category_name
FROM clean.products;

CREATE TABLE gold.dim_order AS
SELECT
  order_id,
  order_status,
  order_purchase_timestamp,
  order_delivered_customer_date,
  order_estimated_delivery_date
FROM clean.orders;

-- Tabla de hechos principal
-- payment_value_allocated: prorrateo del pago total de la orden
-- proporcional al precio de cada item, evitando duplicación
CREATE TABLE gold.fact_sales AS
SELECT
  oi.order_id,
  oi.order_item_id,
  oi.product_id,
  o.customer_id,

  oi.price          AS item_price,
  oi.freight_value,
  op.total_payment,

  -- Prorrateo: cada item recibe su proporción del pago total
  (op.total_payment * oi.price / SUM(oi.price) OVER (PARTITION BY oi.order_id))
    AS payment_value_allocated,

  CASE WHEN o.order_status = 'canceled' THEN 1 ELSE 0 END           AS is_canceled,
  CASE WHEN o.order_delivered_customer_date IS NOT NULL THEN 1 ELSE 0 END AS is_delivered,
  CASE
    WHEN o.order_delivered_customer_date <= o.order_estimated_delivery_date THEN 1
    ELSE 0
  END AS is_on_time,

  o.order_purchase_timestamp::DATE AS order_date

FROM clean.order_items oi

JOIN clean.orders o
  ON oi.order_id = o.order_id

LEFT JOIN (
  SELECT
    order_id,
    SUM(payment_value) AS total_payment
  FROM clean.order_payments
  GROUP BY order_id
) op
  ON oi.order_id = op.order_id;