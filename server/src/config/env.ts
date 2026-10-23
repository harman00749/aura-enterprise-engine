import { z } from "zod";

const booleanFromString = z.preprocess(
  (value) => typeof value === "string" ? value.toLowerCase() === "true" : value,
  z.boolean(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  LOG_HTTP_REQUESTS: booleanFromString.default(true),
});

export type Environment = z.infer<typeof envSchema>;

let cachedEnvironment: Environment | undefined;

export function getEnv(): Environment {
  if (cachedEnvironment) return cachedEnvironment;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  cachedEnvironment = result.data;
  return cachedEnvironment;
}

export function resetEnvCache(): void {
  cachedEnvironment = undefined;
}
