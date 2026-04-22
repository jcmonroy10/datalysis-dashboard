import { Request, Response } from "express";
import { PrismaSalesRepository } from "../../infrastructure/repositories/prismaSales.repository";
import { getSalesByState } from "../../application/use-cases/getSalesByState";
import { serializeBigInt } from "../../utils/serialize";

const repo = new PrismaSalesRepository();

export async function salesByStateHandler(req: Request, res: Response) {
  const { from, to } = req.query;

  const toArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return (val as string[]).filter(Boolean);
    if (typeof val === "string") return val.split(",").filter(Boolean);
    return [];
  };

  const filters = {
    state:    toArray(req.query.state),
    category: toArray(req.query.category),
    status:   toArray(req.query.status),
  };

  const data = await getSalesByState(repo, from as string, to as string, filters);

  const normalized = serializeBigInt(data);

  const safeData = normalized.map((row: any) => ({
    customer_state: row.customer_state,
    revenue: Number(row.revenue || 0),
    orders: Number(row.orders || 0),
  }));

  res.json(safeData);
}