import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestId: RequestHandler = (request, response, next) => {
  const incomingId = request.header("Rndr-Id") || request.header("X-Request-Id");
  response.setHeader("X-Request-Id", incomingId || randomUUID());
  next();
};
