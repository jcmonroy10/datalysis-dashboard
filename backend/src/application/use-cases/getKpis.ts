import { SalesRepository } from "../../domain/repositories/sales.repository";

export async function getKpis(repo: SalesRepository, from: string, to: string, filters?: any) {
  return repo.getKpis(from, to, filters);
}
