import { Request, Response } from 'express';
import { getKpis } from '../../application/use-cases/getKpis';

export async function kpisHandler(req: Request, res: Response) {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing dates' });
  }

  const data = await getKpis(from as string, to as string);

  res.json(data);
}