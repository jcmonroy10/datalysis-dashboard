# Datalysis Technical Test

## Stack
- Frontend: Next.js (TypeScript)
- Backend: Node.js + Express (TypeScript)
- Database: PostgreSQL
- ORM: Prisma (por definir)
- Infraestructura: Docker Compose

## Data Architecture

Se implementaron tres capas de datos:

- raw: datos originales cargados desde CSV
- clean: datos procesados y normalizados
- gold: modelo analítico en esquema estrella (Data Warehouse)

## Data Source
# Datalysis

Business intelligence dashboard for revenue analytics, built with Next.js + Node.js + PostgreSQL.

---

## URLs

| Service   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:3000     |
| Backend   | http://localhost:4000     |
| API Base  | http://localhost:4000/api |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                   Next.js (port 3000)                   │
│        Filters · KPI Cards · Charts · Table             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST (fetch)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                Express API (port 4000)                  │
│                                                         │
│  Controllers → Use Cases → Repository (Prisma)          │
│                                                         │
│  GET /api/kpis                                          │
│  GET /api/revenue-trend                                 │
│  GET /api/top-products                                  │
│  GET /api/sales-by-state                                │
│  GET /api/filter-options                                │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL (Prisma $queryRawUnsafe)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL 15 (port 5432)                  │
│                                                         │
│   raw.*  →  clean.*  →  gold.*                          │
│                                                         │
│   gold.fact_sales                                       │
│   gold.dim_customer · dim_product · dim_order · dim_date│
└─────────────────────────────────────────────────────────┘
```

All services run in Docker containers orchestrated by `docker-compose.yml`.

---

## Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | Next.js 14, TypeScript, Tailwind CSS, Recharts  |
| Backend        | Node.js, Express, TypeScript, Prisma            |
| Database       | PostgreSQL 15                                   |
| Infrastructure | Docker, Docker Compose                          |

---

## Getting Started

### Prerequisites

- Docker + Docker Compose
- The following CSV files placed in `data/` at the project root:
  - `orders.csv`
  - `products.csv`
  - `order_items.csv`
  - `order_payments.csv`
  - `customers.csv`

### Project structure

```
project/
  data/                    ← CSV files here (not included in repo)
    orders.csv
    products.csv
    order_items.csv
    order_payments.csv
    customers.csv
  backend/
    etl/
      schema.sql           ← ETL script (raw → clean → gold)
    src/
    prisma/
  frontend/
    src/
  docker-compose.yml
  README.md
```

### Run the project

```bash
# 1. Start all containers
docker compose up -d

# 2. Run ETL (only needed once — creates and populates the database)
docker cp backend/etl/schema.sql datalysis_db:/schema.sql
docker exec -i datalysis_db psql -U postgres -d datalysis -f /schema.sql

# 3. Open the dashboard
open http://localhost:3000
```

### Re-running the ETL (reset)

```bash
docker exec -i datalysis_db psql -U postgres -d datalysis -c "
DROP SCHEMA raw CASCADE;
DROP SCHEMA clean CASCADE;
DROP SCHEMA gold CASCADE;
"

docker cp backend/etl/schema.sql datalysis_db:/schema.sql
docker exec -i datalysis_db psql -U postgres -d datalysis -f /schema.sql
```

### Verify the ETL ran correctly

```bash
docker exec -it datalysis_db psql -U postgres -d datalysis

\dn                                    -- should show raw, clean, gold
SELECT COUNT(*) FROM gold.fact_sales;
SELECT COUNT(*) FROM gold.dim_customer;
SELECT COUNT(*) FROM gold.dim_product;
\q
```

---

## Star Schema

### Grain

One row per **order item** (`order_id` + `order_item_id`).

### Dimension tables

| Table | Key | Description |
|---|---|---|
| `gold.dim_customer` | `customer_id` | State and city per customer |
| `gold.dim_product` | `product_id` | Product category name |
| `gold.dim_order` | `order_id` | Order status and delivery timestamps |
| `gold.dim_date` | `date` | Calendar table (year, month, day, weekday, week, is_weekend) |

### Fact table: `gold.fact_sales`

| Column | Type | Description |
|---|---|---|
| `order_id` | text | FK → dim_order |
| `order_item_id` | int | Item position within the order |
| `product_id` | text | FK → dim_product |
| `customer_id` | text | FK → dim_customer |
| `order_date` | date | FK → dim_date |
| `item_price` | numeric | Unit price of the item |
| `freight_value` | numeric | Freight cost for the item |
| `payment_value_allocated` | numeric | Prorated share of order total payment |
| `is_canceled` | int | 1 if order status is 'canceled' |
| `is_delivered` | int | 1 if delivery date is not null |
| `is_on_time` | int | 1 if delivered on or before estimated date |

---

## KPI Definitions

| KPI | Definition | Implementation |
|---|---|---|
| **GMV** | Gross Merchandise Value — total value of all items sold before payment adjustments | `SUM(item_price)` |
| **Revenue** | Actual payment collected, prorated per item | `SUM(payment_value_allocated)` |
| **Orders** | Count of unique orders in the period | `COUNT(DISTINCT order_id)` |
| **AOV** | Average Order Value — revenue per order | `SUM(payment_value_allocated) / COUNT(DISTINCT order_id)` |
| **IPO** | Items Per Order — average number of items per order | `COUNT(order_item_id) / COUNT(DISTINCT order_id)` |
| **Cancel Rate** | Proportion of orders that were canceled or unavailable | `COUNT(DISTINCT order_id WHERE status IN ('canceled','unavailable')) / COUNT(DISTINCT order_id)` |
| **On-time Rate** | Proportion of delivered orders that arrived on or before estimated date | `SUM(is_on_time) / SUM(is_delivered)` |

### Payment value allocation

Raw payments exist at the order level. An order can have multiple items and multiple payment rows. Assigning the full payment to each item would cause duplication.

**Solution:** aggregate payments per order, then prorate by item price share:

```sql
-- Aggregate payments per order
LEFT JOIN (
  SELECT order_id, SUM(payment_value) AS total_payment
  FROM clean.order_payments
  GROUP BY order_id
) op ON oi.order_id = op.order_id

-- Prorate by item price share (window function)
(op.total_payment * oi.price / SUM(oi.price) OVER (PARTITION BY oi.order_id))
  AS payment_value_allocated
```

This guarantees `SUM(payment_value_allocated)` across all items of an order equals `total_payment`, with zero duplication.

---

## Technical Decisions & Tradeoffs

### `$queryRawUnsafe` instead of Prisma ORM

Prisma's query builder doesn't support dynamic `IN` clauses with variable-length arrays or window functions like `SUM() OVER (PARTITION BY ...)`. Using `$queryRawUnsafe` gives full SQL control for complex analytical queries. The tradeoff is losing Prisma's type safety on the query itself, mitigated by validating and sanitizing all filter inputs in `buildFilters.ts` before they reach the query.

### ETL as a single SQL script

The entire pipeline (raw → clean → gold) lives in `etl/schema.sql` and is run once via `psql`. The alternative would be a Node.js orchestrator running queries step by step, but for a dataset of this size a single SQL file is simpler, faster, and easier to audit. The tradeoff is that re-running requires manually dropping schemas first.

### Debounced filters (500ms)

Filter changes in the frontend are debounced 500ms before triggering API calls. This avoids sending a request on every keystroke or dropdown click when the user is still selecting options. The tradeoff is a small perceived delay, which is acceptable given the analytical nature of the dashboard.

### Dual Y-axis chart

Revenue and Orders are shown on the same chart with separate Y-axes because their scales differ by orders of magnitude. A single Y-axis would flatten the Orders line making it unreadable. The tradeoff is slightly more complex chart configuration.

### Comma-separated filter params

Filters are sent as comma-separated query strings (`?status=delivered,canceled`) rather than repeated keys (`?status=delivered&status=canceled`). This simplifies URL construction on the frontend. The tradeoff is that the backend must parse and split the string in each controller, handled by a shared `toArray()` utility.

---

## ETL Process

The pipeline runs in three stages: **raw → clean → gold**.

### Stage 1 — Raw

Tables loaded directly from CSV with no transformation via PostgreSQL `COPY`.

Tables: `raw.orders`, `raw.order_items`, `raw.order_payments`, `raw.customers`, `raw.products`

### Stage 2 — Clean

| Rule | Detail |
|---|---|
| Timestamp → Date | `order_purchase_timestamp::DATE` as `order_date` |
| Drop unused columns | Removed seller info, zip codes, product dimensions, payment metadata |
| Category normalization | Only `product_id` + `product_category_name` kept |

### Stage 3 — Gold

Star schema built from clean tables. See [Star Schema](#star-schema) section above.

---

## API Endpoints

All endpoints accept:

| Param | Type | Example |
|---|---|---|
| `from` | date | `2017-01-01` |
| `to` | date | `2018-01-01` |
| `state` | comma-separated string | `SP,RJ` |
| `category` | comma-separated string | `informatica_acessorios` |
| `status` | comma-separated string | `delivered,canceled` |

| Endpoint | Description |
|---|---|
| `GET /api/kpis` | All 7 KPIs for the selected period and filters |
| `GET /api/revenue-trend` | Revenue + orders over time (daily or weekly grain) |
| `GET /api/top-products` | Top categories ranked by GMV or Revenue |
| `GET /api/sales-by-state` | Revenue and orders aggregated by customer state |
| `GET /api/filter-options` | Available values for state, category, and status dropdowns |

---

## Tests

```bash
cd backend
npm test
```

| File | Type | Tests |
|---|---|---|
| `buildFilters.test.ts` | Unit | 5 — empty filters, single value, multiple values, combined filters, empty arrays |
| `useCases.test.ts` | Unit | 3 — getKpis, getTopProducts, getRevenueTrend with mocked repo |
| `kpis.integration.test.ts` | Integration | 2 — 200 with valid data, 500 on DB error |

---

## Linting & Formatting

```bash
cd backend
npm run lint      # ESLint
npm run format    # Prettier
```
Dataset utilizado: Brazilian E-Commerce Public Dataset by Olist.

Se cargaron los siguientes archivos en el esquema raw:
- orders
- order_items
- order_payments
- customers
- products