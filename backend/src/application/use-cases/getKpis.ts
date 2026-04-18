import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getKpis(from: string, to: string) {
  const result = await prisma.$queryRawUnsafe(`
    SELECT
      SUM(item_price) AS gmv,
      SUM(payment_value_allocated) AS revenue,
      COUNT(DISTINCT order_id) AS orders
    FROM gold.fact_sales
    WHERE order_date BETWEEN '${from}' AND '${to}'
  `);

  return result;
}