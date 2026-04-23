# Datalysis Dashboard

Dashboard de inteligencia de negocios para análisis de ventas, construido con Next.js + Node.js + PostgreSQL sobre una arquitectura de Data Warehouse (raw → clean → gold).

---

## URLs

| Servicio  | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:3000     |
| Backend   | http://localhost:4000     |
| API Base  | http://localhost:4000     |

---

## Stack tecnológico

| Capa           | Tecnología                                      |
|----------------|-------------------------------------------------|
| Frontend       | Next.js 14, TypeScript, Tailwind CSS, Recharts  |
| Backend        | Node.js, Express, TypeScript, Prisma            |
| Base de datos  | PostgreSQL 15                                   |
| Infraestructura| Docker, Docker Compose                          |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                   Next.js (port 3000)                   │
│        Filtros · KPI Cards · Gráficos · Tabla           │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST (fetch)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                Express API (port 4000)                  │
│                                                         │
│  Controllers → Use Cases → Repository (Prisma)          │
│                                                         │
│  GET /health                                            │
│  GET /kpis                                              │
│  GET /revenue-trend                                     │
│  GET /top-products                                      │
│  GET /sales-by-state                                    │
│  GET /filters/options                                   │
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

Todos los servicios corren en contenedores Docker orquestados por `docker-compose.yml`.

El backend implementa **arquitectura hexagonal**:
- `src/adapters/http` — controllers (kpis, revenueTrend, salesByState, topProducts, filterOptions) + middlewares (asyncHandler, errorHandler, validateQuery)
- `src/application/use-cases` — casos de uso (getKpis, getRevenueTrend, getSalesByState, getTopProducts, getFilterOptions)
- `src/domain/repositories` — interfaces de repositorios (ports)
- `src/infrastructure/db` — cliente Prisma + buildFilters
- `src/infrastructure/repositories` — implementación con Prisma (prismaSales.repository)

---

## Estructura del proyecto

```
datalysis-dashboard/
  data/                    ← Archivos CSV del dataset Olist
    orders.csv
    products.csv
    order_items.csv
    order_payments.csv
    customers.csv
  backend/
    etl/
      schema.sql           ← Script ETL completo (raw → clean → gold)
    src/
    prisma/
  frontend/
    src/
  docker-compose.yml
  README.md
```

---

## Cómo ejecutar el proyecto

### Requisitos previos

- Docker + Docker Compose
- Archivos CSV del dataset Olist ubicados en `data/` en la raíz del proyecto

### Levantar el proyecto

```bash
# 1. Clonar el repositorio
git clone https://github.com/jcmonroy10/datalysis-dashboard.git
cd datalysis-dashboard

# 2. Levantar los contenedores
docker compose up -d

# 3. Ejecutar el ETL (solo una vez — crea y puebla la base de datos)
docker cp backend/etl/schema.sql datalysis_db:/schema.sql
docker exec -i datalysis_db psql -U postgres -d datalysis -f /schema.sql

# 4. Abrir el dashboard
http://localhost:3000
```

### Re-ejecutar el ETL (reset)

```bash
docker exec -i datalysis_db psql -U postgres -d datalysis -c "
DROP SCHEMA IF EXISTS raw CASCADE;
DROP SCHEMA IF EXISTS clean CASCADE;
DROP SCHEMA IF EXISTS gold CASCADE;
"

docker cp backend/etl/schema.sql datalysis_db:/schema.sql
docker exec -i datalysis_db psql -U postgres -d datalysis -f /schema.sql
```

### Verificar que el ETL corrió correctamente

```bash
docker exec -it datalysis_db psql -U postgres -d datalysis

\dn                                    -- debe mostrar raw, clean, gold
SELECT COUNT(*) FROM gold.fact_sales;
SELECT COUNT(*) FROM gold.dim_customer;
SELECT COUNT(*) FROM gold.dim_product;
\q
```

---

## Variables de entorno

El backend usa las siguientes variables (ya configuradas en `docker-compose.yml`):

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/datalysis
```

---

## Esquema Estrella (Star Schema)

### Grain

Una fila por **item de orden** (`order_id` + `order_item_id`).

### Tablas de dimensiones

| Tabla | Clave | Descripción |
|---|---|---|
| `gold.dim_customer` | `customer_id` | Estado y ciudad del cliente |
| `gold.dim_product` | `product_id` | Categoría del producto |
| `gold.dim_order` | `order_id` | Estado de la orden y timestamps de entrega |
| `gold.dim_date` | `date` | Calendario completo (año, mes, día, semana, is_weekend) |

### Tabla de hechos: `gold.fact_sales`

| Columna | Tipo | Descripción |
|---|---|---|
| `order_id` | text | FK → dim_order |
| `order_item_id` | int | Posición del item dentro de la orden |
| `product_id` | text | FK → dim_product |
| `customer_id` | text | FK → dim_customer |
| `order_date` | date | FK → dim_date |
| `item_price` | numeric | Precio unitario del item |
| `freight_value` | numeric | Costo de envío del item |
| `payment_value_allocated` | numeric | Parte proporcional del pago total de la orden |
| `is_canceled` | int | 1 si el status de la orden es 'canceled' |
| `is_delivered` | int | 1 si la fecha de entrega no es null |
| `is_on_time` | int | 1 si se entregó antes o en la fecha estimada |

---

## Definición de KPIs

| KPI | Definición | Implementación SQL |
|---|---|---|
| **GMV** | Valor bruto de mercancía — suma de precios de items vendidos | `SUM(item_price)` |
| **Revenue** | Pago real recibido, prorrateado por item | `SUM(payment_value_allocated)` |
| **Orders** | Órdenes únicas en el período | `COUNT(DISTINCT order_id)` |
| **AOV** | Valor promedio por orden | `SUM(payment_value_allocated) / COUNT(DISTINCT order_id)` |
| **IPO** | Items promedio por orden | `COUNT(order_item_id) / COUNT(DISTINCT order_id)` |
| **Cancel Rate** | Proporción de órdenes canceladas o no disponibles | `COUNT(DISTINCT order_id WHERE status IN ('canceled','unavailable')) / COUNT(DISTINCT order_id)` |
| **On-time Rate** | Proporción de entregas realizadas a tiempo | `SUM(is_on_time) / SUM(is_delivered)` |

> **Nota sobre Cancel Rate:** se incluyen tanto `canceled` como `unavailable` ya que ambos representan transacciones no completadas desde el punto de vista del negocio.

### Asignación de payment_value a nivel item

Los pagos en Olist existen a nivel de orden y una orden puede tener múltiples items y múltiples filas de pago. Asignar el pago completo a cada item causaría duplicación.

**Solución:** se agregan los pagos por orden y luego se prorratean proporcionalmente al precio de cada item usando una window function:

```sql
-- Paso 1: agregar pagos por orden
LEFT JOIN (
  SELECT order_id, SUM(payment_value) AS total_payment
  FROM clean.order_payments
  GROUP BY order_id
) op ON oi.order_id = op.order_id

-- Paso 2: prorratear por proporción del precio del item
(op.total_payment * oi.price / SUM(oi.price) OVER (PARTITION BY oi.order_id))
  AS payment_value_allocated
```

Esto garantiza que `SUM(payment_value_allocated)` sobre todos los items de una orden sea igual a `total_payment`, sin duplicación.

---

## Proceso ETL

El pipeline corre en tres etapas: **raw → clean → gold**.

### Etapa 1 — Raw (tablas fuente)

Tablas cargadas directamente desde CSV sin transformación usando `COPY` de PostgreSQL:

| Tabla | Descripción |
|---|---|
| `raw.orders` | Cabeceras de órdenes con timestamps y status |
| `raw.order_items` | Items por orden (producto, precio, flete) |
| `raw.order_payments` | Pagos por orden (puede haber múltiples filas) |
| `raw.customers` | Datos de ubicación del cliente (ciudad, estado) |
| `raw.products` | Catálogo de productos con categorías |

> **¿Por qué raw tiene todas las columnas?** Porque raw replica fielmente la fuente de datos sin transformaciones. Las transformaciones se aplican en clean y gold para mantener trazabilidad y separación de responsabilidades.

### Etapa 2 — Clean (reglas de limpieza)

| Regla | Detalle |
|---|---|
| Timestamp → Date | `order_purchase_timestamp::DATE` extraído como `order_date` |
| Eliminar columnas no usadas | Se removieron seller info, códigos postales, dimensiones de productos, metadata de pagos |
| Normalización de categorías | Solo se conserva `product_id` + `product_category_name` |

> En clean aún no se calculan KPIs, solo se deja la data "usable" para el modelo analítico.

### Etapa 3 — Gold

Esquema estrella construido desde las tablas clean. Ver sección Esquema Estrella.

---

## API Endpoints

Todos los endpoints aceptan los siguientes query params:

| Param | Tipo | Ejemplo |
|---|---|---|
| `from` | fecha | `2017-01-01` |
| `to` | fecha | `2018-01-01` |
| `state` | string separado por comas | `SP,RJ` |
| `category` | string separado por comas | `informatica_acessorios` |
| `status` | string separado por comas | `delivered,canceled` |

| Endpoint | Descripción |
|---|---|
| `GET /health` | Health check del servidor |
| `GET /kpis` | Los 7 KPIs para el período y filtros seleccionados |
| `GET /revenue-trend` | Revenue + órdenes en el tiempo (granularidad diaria o semanal) |
| `GET /top-products` | Top categorías por GMV o Revenue |
| `GET /sales-by-state` | Revenue y órdenes por estado del cliente |
| `GET /filters/options` | Valores disponibles para los dropdowns de filtros |

### Validaciones

- `from` y `to` son obligatorios → 400 si faltan
- Formato de fecha válido → 400 si es inválido
- `from` debe ser anterior a `to` → 400 si no se cumple
- `limit` entre 1 y 50 → 400 si está fuera de rango

---

## Tests

```bash
cd backend
npm test
```

| Archivo | Tipo | Tests |
|---|---|---|
| `buildFilters.test.ts` | Unitario | 5 — filtros vacíos, valor único, múltiples valores, filtros combinados, arrays vacíos ignorados |
| `useCases.test.ts` | Unitario | 3 — getKpis, getTopProducts, getRevenueTrend con repo mockeado |
| `kpis.integration.test.ts` | Integración | 2 — 200 con datos válidos, 500 con error de DB |

---

## Linting y Formateo

```bash
cd backend
npm run lint      # ESLint
npm run format    # Prettier
```

---

## Decisiones técnicas y tradeoffs

### `$queryRawUnsafe` en vez de Prisma ORM

El query builder de Prisma no soporta cláusulas `IN` dinámicas con arrays de longitud variable ni window functions como `SUM() OVER (PARTITION BY ...)`. Usar `$queryRawUnsafe` da control total sobre SQL para queries analíticas complejas. El tradeoff es perder el type safety de Prisma en el query, mitigado validando y sanitizando todos los inputs en `buildFilters.ts` antes de que lleguen al query.

> Usar Prisma como gestor de conexión y SQL directo para analytics es la combinación correcta: permite optimizar agregaciones y joins complejos manteniendo seguridad contra SQL injection mediante parámetros posicionales.

### ETL como script SQL único

Todo el pipeline (raw → clean → gold) vive en `etl/schema.sql` y se ejecuta una vez vía `psql`. La alternativa sería un orquestador Node.js ejecutando queries paso a paso, pero para este tamaño de dataset un solo archivo SQL es más simple, rápido y fácil de auditar. El tradeoff es que re-ejecutarlo requiere dropear los schemas manualmente.

### Filtros debounced (500ms)

Los cambios de filtros en el frontend se debouncean 500ms antes de disparar llamadas a la API. Esto evita enviar una request en cada click o keystroke cuando el usuario todavía está seleccionando opciones. El tradeoff es un pequeño delay percibido, aceptable dado el contexto analítico del dashboard.

### Gráfico con doble eje Y

Revenue y Orders se muestran en el mismo gráfico con ejes Y separados porque sus escalas difieren en órdenes de magnitud. Un solo eje Y aplastaría la línea de Orders haciéndola ilegible. El tradeoff es una configuración de gráfico ligeramente más compleja.

### Filtros como query params separados por comas

Los filtros se envían como strings separados por comas (`?status=delivered,canceled`) en vez de keys repetidos (`?status=delivered&status=canceled`). Esto simplifica la construcción de la URL en el frontend. El tradeoff es que el backend debe parsear y separar el string en cada controller, manejado por una utilidad `toArray()` compartida.

### Compatibilidad Prisma + Node en Docker

Se detectó incompatibilidad entre Prisma y Node 18 en Docker. Se resolvió actualizando la imagen base a Node 20 para cumplir los requisitos del runtime de Prisma.

---

## Autor

Juan Carlos Monroy