import { randomUUID } from "node:crypto";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { getEnv } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { apiRateLimiter } from "./middleware/rate-limit.js";
import { requestId } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/request-logger.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { AppError } from "./utils/app-error.js";
import { sendSuccess } from "./utils/responses.js";

export function createApp() {
  const app = express();
  const allowedOrigins = getEnv().CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(compression());
  app.use(requestId);
  app.use(requestLogger);
  app.use(cors({
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Request-Id"],
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, "CORS_ORIGIN_REJECTED", "This origin is not allowed by the API CORS policy."));
    },
  }));
  app.use(express.json({ limit: "64kb" }));

  app.get("/", (_request, response) => {
    sendSuccess(response, 200, {
      service: "Aura Engine API",
      version: "1.0.0",
      health: "/api/health",
      inventory: "/api/inventory",
      analytics: "/api/analytics",
    });
  });

  app.get("/api/health", (_request, response) => {
    sendSuccess(response, 200, {
      service: "aura-engine-api",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      requestId: response.getHeader("X-Request-Id") || randomUUID(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiRateLimiter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
