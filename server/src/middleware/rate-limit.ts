import { rateLimit } from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests. Please retry shortly." },
  },
});

export const mutationRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "MUTATION_RATE_LIMITED", message: "Too many inventory changes. Please retry shortly." },
  },
});
