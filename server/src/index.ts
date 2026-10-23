import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { getEnv } from "./config/env.js";
import { Product } from "./models/product.model.js";

async function start(): Promise<void> {
  const environment = getEnv();
  await connectDatabase();
  await Product.createIndexes();

  const server = createServer(createApp());
  server.listen(environment.PORT, "0.0.0.0", () => {
    console.info(`Aura Engine API listening on port ${environment.PORT}.`);
  });

  const shutdown = async (signal: string) => {
    console.info(`Received ${signal}; closing Aura Engine API gracefully.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Aura Engine API failed to start.", error);
  process.exit(1);
});
