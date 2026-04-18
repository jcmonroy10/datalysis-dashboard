import { Request, Response } from 'express';
import { getKpis } from '../../application/use-cases/getKpis';

export async function kpisHandler(req: Request, res: Response) {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing dates' });
  }

  const data = await getKpis(from as string, to as string);

  //1. Convertir BigInt → Number
  const normalized = JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );

  //2. Formatear números (strings → number + 2 decimales)
  const safeData = normalized.map((row: any) => ({
    gmv: Number(parseFloat(row.gmv).toFixed(2)),
    revenue: Number(parseFloat(row.revenue).toFixed(2)),
    orders: Number(row.orders),
  }));

  res.json(safeData);
}