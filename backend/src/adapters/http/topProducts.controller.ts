import { Request, Response } from "express";
import { PrismaSalesRepository } from "../../infrastructure/repositories/prismaSales.repository";
import { getTopProducts } from "../../application/use-cases/getTopProducts";
import { serializeBigInt } from "../../utils/serialize";

const repo = new PrismaSalesRepository();

export async function topProductsHandler(req: Request, res: Response) {
  const { from, to, metric = "gmv", limit = 10, state, category, status } = req.query;

  const filters = { state, category, status };

  const data = await getTopProducts(
    repo,
    from as string,
    to as string,
    metric as string,
    Number(limit),
    filters
  );

  const normalized = serializeBigInt(data);

  const safeData = normalized.map((row: any) => ({
    product_category_name: row.product_category_name,
    value: Number(row.value || 0),
  }));

  res.json(safeData);
}