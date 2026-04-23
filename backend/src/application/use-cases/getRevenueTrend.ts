import { SalesRepository } from "../../domain/repositories/sales.repository";

export async function getRevenueTrend(
  repo: SalesRepository,
  from: string,
  to: string,
  grain: string,
  filters?: any
) {
  return repo.getRevenueTrend(from, to, grain, filters);
}
