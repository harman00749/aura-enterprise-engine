import type { Response } from "express";

export function sendSuccess<T>(
  response: Response,
  statusCode: number,
  data: T,
  message?: string,
): void {
  response.status(statusCode).json({ success: true, message, data });
}
