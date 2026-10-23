import mongoose from "mongoose";
import { getEnv } from "./env.js";

export async function connectDatabase(): Promise<void> {
  const { MONGODB_URI, NODE_ENV } = getEnv();
  mongoose.set("strictQuery", true);
  mongoose.set("autoIndex", NODE_ENV !== "production");
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
