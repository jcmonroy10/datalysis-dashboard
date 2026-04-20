import { SalesRepository } from "../../domain/repositories/sales.repository";

export async function getFilterOptions(repo: SalesRepository) {
  return repo.getFilterOptions();
}