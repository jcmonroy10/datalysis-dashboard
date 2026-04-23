import { SalesRepository } from "../../domain/repositories/sales.repository";

export async function getTopProducts(
  repo: SalesRepository,
  from: string,
  to: string,
  metric: string,
  limit: number,
  filters?: any
) {
  return repo.getTopProducts(from, to, metric, limit, filters);
}
