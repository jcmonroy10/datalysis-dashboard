import { Request, Response, NextFunction } from "express";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  return res.status(500).json({
    error: "Internal server error",
    message: (err as Error).message,
  });
}
