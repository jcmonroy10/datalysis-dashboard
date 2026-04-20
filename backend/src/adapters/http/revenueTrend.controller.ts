import { Request, Response } from "express";
import { PrismaSalesRepository } from "../../infrastructure/repositories/prismaSales.repository";
import { getRevenueTrend } from "../../application/use-cases/getRevenueTrend";
import { serializeBigInt } from "../../utils/serialize";

const repo = new PrismaSalesRepository();

export async function revenueTrendHandler(req: Request, res: Response) {
  const { from, to, grain, state, category, status } = req.query;

  const filters = { state, category, status };

  const data = await getRevenueTrend(
    repo,
    from as string,
    to as string,
    (grain as string) || "day",
    filters
  );

  const normalized = serializeBigInt(data);

  const safeData = normalized.map((row: any) => ({
    period: row.period,
    revenue: Number(row.revenue || 0),
    orders: Number(row.orders || 0),
  }));

  res.json(safeData);
}