import type { RequestHandler } from "express";
import { getEnv } from "../config/env.js";

export const requestLogger: RequestHandler = (request, response, next) => {
  if (!getEnv().LOG_HTTP_REQUESTS) {
    next();
    return;
  }

  const startedAt = performance.now();
  response.on("finish", () => {
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
    console.info(JSON.stringify({
      level: "info",
      event: "http_request",
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs,
      requestId: response.getHeader("X-Request-Id"),
    }));
  });
  next();
};
