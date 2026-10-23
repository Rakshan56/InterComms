import type { Response } from "express";

export const errorResponse = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

export const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;
