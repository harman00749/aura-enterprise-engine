import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Product } from "../models/product.model.js";

async function verifyIndexes(): Promise<void> {
  await connectDatabase();
  await Product.createIndexes();
  const indexes = await Product.collection.indexes();
  console.info(JSON.stringify(indexes.map(({ name, key, unique }) => ({ name, key, unique: Boolean(unique) })), null, 2));

  const required = ["sku_unique_idx", "category_idx", "product_name_idx", "product_name_text_idx"];
  const missing = required.filter((name) => !indexes.some((index) => index.name === name));
  if (missing.length > 0) throw new Error(`Required indexes are missing: ${missing.join(", ")}`);
  console.info("All required Aura Engine indexes are active.");
}

verifyIndexes()
  .catch((error) => {
    console.error("Index verification failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
