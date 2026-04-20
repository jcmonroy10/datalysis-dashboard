import { Request, Response } from 'express';
import { getKpis } from '../../application/use-cases/getKpis';
import { PrismaSalesRepository } from '../../infrastructure/repositories/prismaSales.repository';
import { serializeBigInt } from '../../utils/serialize';

const repo = new PrismaSalesRepository();

export async function kpisHandler(req: Request, res: Response) {
  const { from, to, state, category, status } = req.query;

  const filters = { state, category, status };

  const data = await getKpis(repo, from as string, to as string, filters);

  const normalized = serializeBigInt(data);

  const safeData = normalized.map((row: any) => ({
    gmv: Number(row.gmv || 0),
    revenue: Number(row.revenue || 0),
    orders: Number(row.orders || 0),
    aov: Number(row.aov || 0),
    ipo: Number(row.ipo || 0),
    cancel_rate: Number(row.cancel_rate || 0),
    on_time_rate: Number(row.on_time_rate || 0),
  }));

  res.json(safeData);
}