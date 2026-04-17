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

Dataset utilizado: Brazilian E-Commerce Public Dataset by Olist.

Se cargaron los siguientes archivos en el esquema raw:
- orders
- order_items
- order_payments
- customers
- products