import { Request, Response } from "express";
import { PrismaSalesRepository } from "../../infrastructure/repositories/prismaSales.repository";
import { getFilterOptions } from "../../application/use-cases/getFilterOptions";

const repo = new PrismaSalesRepository();

export async function filterOptionsHandler(req: Request, res: Response) {
  const data = await getFilterOptions(repo);
  res.json(data);
}