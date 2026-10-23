import "dotenv/config";
import { faker } from "@faker-js/faker";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Product } from "../models/product.model.js";

const TARGET_COUNT = 50_000;
const BATCH_SIZE = 2_500;
const categories = [
  "audio",
  "computers",
  "electronics",
  "home",
  "industrial",
  "mobile",
  "office",
  "outdoors",
  "smart-home",
  "wearables",
] as const;

function buildProduct(index: number) {
  const category = categories[index % categories.length] ?? "general";
  const price = faker.number.float({ min: 8, max: 4_500, fractionDigits: 2 });
  const costRatio = faker.number.float({ min: 0.35, max: 0.82, fractionDigits: 2 });
  const cost = Math.round(price * costRatio * 100) / 100;
  const stockQuantity = faker.number.int({ min: 0, max: 2_500 });
  const reorderLevel = faker.number.int({ min: 10, max: 180 });

  return {
    productName: index % 250 === 0
      ? `Rugged Laptop ${faker.commerce.productAdjective()} Series`
      : `${faker.commerce.productAdjective()} ${faker.commerce.productName()}`,
    sku: `AUR-${String(index + 1).padStart(7, "0")}`,
    category,
    price,
    cost,
    stockQuantity,
    reorderLevel,
    lastUpdated: faker.date.recent({ days: 180 }),
  };
}

async function seed(): Promise<void> {
  faker.seed(18_500);
  await connectDatabase();

  if (process.argv.includes("--reset")) {
    console.info("Reset requested; removing existing mock inventory.");
    await Product.deleteMany({});
  }

  const existingCount = await Product.countDocuments({});
  if (existingCount >= TARGET_COUNT) {
    console.info(`Seed skipped: database already contains ${existingCount.toLocaleString()} products.`);
    await Product.createIndexes();
    return;
  }

  console.info(`Seeding ${TARGET_COUNT - existingCount} products in batches of ${BATCH_SIZE}.`);
  for (let start = existingCount; start < TARGET_COUNT; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, TARGET_COUNT);
    const batch = Array.from({ length: end - start }, (_, offset) => buildProduct(start + offset));
    await Product.insertMany(batch, { ordered: true });
    console.info(`Seed progress: ${end.toLocaleString()} / ${TARGET_COUNT.toLocaleString()}`);
  }

  await Product.createIndexes();
  console.info(`Seed complete: ${(await Product.countDocuments({})).toLocaleString()} products available.`);
}

seed()
  .catch((error) => {
    console.error("Inventory seeding failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
