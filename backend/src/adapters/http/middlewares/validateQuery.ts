import { Request, Response, NextFunction } from "express";

export function isValidDate(date: string) {
  return !isNaN(Date.parse(date));
}

export function validateDateRange(req: Request, res: Response, next: NextFunction) {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "Missing dates (from, to)" });
  }

  if (!isValidDate(from as string) || !isValidDate(to as string)) {
    return res.status(400).json({ error: "Invalid date format (YYYY-MM-DD)" });
  }

  next();
}