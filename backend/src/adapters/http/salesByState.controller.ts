import { Request, Response } from "express";
import { PrismaSalesRepository } from "../../infrastructure/repositories/prismaSales.repository";
import { getSalesByState } from "../../application/use-cases/getSalesByState";
import { serializeBigInt } from "../../utils/serialize";

const repo = new PrismaSalesRepository();

export async function salesByStateHandler(req: Request, res: Response) {
  const { from, to, state, category, status } = req.query;

  const filters = { state, category, status };

  const data = await getSalesByState(
    repo,
    from as string,
    to as string,
    filters
  );

  const normalized = serializeBigInt(data);

  const safeData = normalized.map((row: any) => ({
    customer_state: row.customer_state,
    revenue: Number(row.revenue || 0),
    orders: Number(row.orders || 0),
  }));

  res.json(safeData);
}