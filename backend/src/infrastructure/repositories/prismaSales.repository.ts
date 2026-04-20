import { PrismaClient } from '@prisma/client';
import { SalesRepository } from '../../domain/repositories/sales.repository';
import { buildFilters } from '../db/buildFilters';

const prisma = new PrismaClient();

export class PrismaSalesRepository implements SalesRepository {

  async getKpis(from: string, to: string, filters: any = {}) {
    const baseConditions = [`f.order_date BETWEEN $1::date AND $2::date`];
    const baseParams = [from, to];

    const { conditions, params } = buildFilters(filters, 3);
    const whereClause = [...baseConditions, ...conditions].join(" AND ");

    return prisma.$queryRawUnsafe(
      `
      SELECT
        SUM(f.item_price) AS gmv,
        SUM(f.payment_value_allocated) AS revenue,
        COUNT(DISTINCT f.order_id) AS orders,

        CASE 
          WHEN COUNT(DISTINCT f.order_id) = 0 THEN 0
          ELSE SUM(f.payment_value_allocated) / COUNT(DISTINCT f.order_id)
        END AS aov,

        CASE 
          WHEN COUNT(DISTINCT f.order_id) = 0 THEN 0
          ELSE COUNT(f.order_item_id)::decimal / COUNT(DISTINCT f.order_id)
        END AS ipo,

        CASE 
          WHEN COUNT(DISTINCT f.order_id) = 0 THEN 0
          ELSE 
            COUNT(DISTINCT CASE WHEN f.is_canceled = 1 THEN f.order_id END)::decimal
            / COUNT(DISTINCT f.order_id)
        END AS cancel_rate,

        CASE 
          WHEN SUM(f.is_delivered) = 0 THEN 0
          ELSE SUM(f.is_on_time)::decimal / SUM(f.is_delivered)
        END AS on_time_rate

      FROM gold.fact_sales f
      LEFT JOIN gold.dim_customer c ON f.customer_id = c.customer_id
      LEFT JOIN gold.dim_product p ON f.product_id = p.product_id
      LEFT JOIN gold.dim_order o ON f.order_id = o.order_id

      WHERE ${whereClause}
      `,
      ...baseParams,
      ...params
    );
  }

  async getTopProducts(
    from: string,
    to: string,
    metric: string,
    limit: number,
    filters: any = {}
  ) {
    const baseConditions = [`f.order_date BETWEEN $1::date AND $2::date`];
    const baseParams = [from, to];

    const { conditions, params } = buildFilters(filters, 3);
    const whereClause = [...baseConditions, ...conditions].join(" AND ");

    const metricColumn =
      metric === "revenue"
        ? "SUM(f.payment_value_allocated)"
        : "SUM(f.item_price)";

    const safeLimit = Math.min(Math.max(limit || 10, 1), 50); // 1–50

    return prisma.$queryRawUnsafe(
      `
      SELECT
        p.product_category_name,
        ${metricColumn} AS value
      FROM gold.fact_sales f
      JOIN gold.dim_product p ON f.product_id = p.product_id
      LEFT JOIN gold.dim_customer c ON f.customer_id = c.customer_id
      LEFT JOIN gold.dim_order o ON f.order_id = o.order_id

      WHERE ${whereClause}
      GROUP BY p.product_category_name
      ORDER BY value DESC
      LIMIT ${safeLimit}
      `,
      ...baseParams,
      ...params
    );
  }

  async getRevenueTrend(
    from: string,
    to: string,
    grain: string,
    filters: any = {}
  ) {
    const baseConditions = [`f.order_date BETWEEN $1::date AND $2::date`];
    const baseParams = [from, to];

    const { conditions, params } = buildFilters(filters, 3);
    const whereClause = [...baseConditions, ...conditions].join(" AND ");

    const safeGrain = grain === "week" ? "week" : "day";

    return prisma.$queryRawUnsafe(
      `
      SELECT
        DATE_TRUNC('${safeGrain}', f.order_date) AS period,
        SUM(f.payment_value_allocated) AS revenue,
        COUNT(DISTINCT f.order_id) AS orders
      FROM gold.fact_sales f
      LEFT JOIN gold.dim_customer c ON f.customer_id = c.customer_id
      LEFT JOIN gold.dim_product p ON f.product_id = p.product_id
      LEFT JOIN gold.dim_order o ON f.order_id = o.order_id

      WHERE ${whereClause}
      GROUP BY period
      ORDER BY period
      `,
      ...baseParams,
      ...params
    );
  }

  async getSalesByState(from: string, to: string, filters: any = {}) {
    const baseConditions = [`f.order_date BETWEEN $1::date AND $2::date`];
    const baseParams = [from, to];

    const { conditions, params } = buildFilters(filters, 3);
    const whereClause = [...baseConditions, ...conditions].join(" AND ");

    return prisma.$queryRawUnsafe(
      `
      SELECT
        c.customer_state,
        SUM(f.payment_value_allocated) AS revenue,
        COUNT(DISTINCT f.order_id) AS orders
      FROM gold.fact_sales f
      JOIN gold.dim_customer c ON f.customer_id = c.customer_id
      LEFT JOIN gold.dim_product p ON f.product_id = p.product_id
      LEFT JOIN gold.dim_order o ON f.order_id = o.order_id

      WHERE ${whereClause}
      GROUP BY c.customer_state
      ORDER BY revenue DESC
      `,
      ...baseParams,
      ...params
    );
  }

  async getFilterOptions() {
    const states = await prisma.$queryRaw<
        { customer_state: string }[]
    >`
        SELECT DISTINCT customer_state FROM gold.dim_customer ORDER BY customer_state
    `;

    const categories = await prisma.$queryRaw<
        { product_category_name: string }[]
    >`
        SELECT DISTINCT product_category_name FROM gold.dim_product ORDER BY product_category_name
    `;

    const statuses = await prisma.$queryRaw<
        { order_status: string }[]
    >`
        SELECT DISTINCT order_status FROM gold.dim_order ORDER BY order_status
    `;

    return {
        states,
        categories,
        statuses,
    };
    }
}