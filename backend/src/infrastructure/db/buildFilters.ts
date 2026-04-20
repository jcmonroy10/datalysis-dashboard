export function buildFilters(filters: any, startIndex = 3) {
  const conditions: string[] = [];
  const params: any[] = [];
  let index = startIndex;

  if (filters?.state) {
    conditions.push(`c.customer_state = $${index++}`);
    params.push(filters.state);
  }

  if (filters?.category) {
    conditions.push(`p.product_category_name = $${index++}`);
    params.push(filters.category);
  }

  if (filters?.status) {
    conditions.push(`o.order_status = $${index++}`);
    params.push(filters.status);
  }

  return { conditions, params };
}