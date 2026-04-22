export function buildFilters(filters: any, startIndex = 3) {
  const conditions: string[] = [];
  const params: any[] = [];
  let index = startIndex;

  if (filters?.state?.length) {
    const placeholders = filters.state.map((_: any) => `$${index++}`).join(",");
    conditions.push(`c.customer_state IN (${placeholders})`);
    params.push(...filters.state);
  }

  if (filters?.category?.length) {
    const placeholders = filters.category.map((_: any) => `$${index++}`).join(",");
    conditions.push(`p.product_category_name IN (${placeholders})`);
    params.push(...filters.category);
  }

  if (filters?.status?.length) {
    const placeholders = filters.status.map((_: any) => `$${index++}`).join(",");
    conditions.push(`o.order_status IN (${placeholders})`);
    params.push(...filters.status);
  }

  return { conditions, params };
}