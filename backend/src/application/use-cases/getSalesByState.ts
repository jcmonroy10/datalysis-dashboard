import { SalesRepository } from "../../domain/repositories/sales.repository";

export async function getSalesByState(
  repo: SalesRepository,
  from: string,
  to: string,
  filters?: any
) {
  return repo.getSalesByState(from, to, filters);
}
