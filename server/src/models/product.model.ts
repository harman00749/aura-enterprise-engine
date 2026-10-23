import { model, Schema, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    productName: { type: String, required: true, trim: true, maxlength: 160 },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 48 },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, required: true, default: Date.now },
  },
  {
    versionKey: false,
    collection: "products",
    toJSON: {
      transform: (_document, returned) => {
        const serialized = returned as Record<string, unknown>;
        serialized.id = String(serialized._id);
        delete serialized._id;
      },
    },
  },
);

productSchema.index({ sku: 1 }, { unique: true, name: "sku_unique_idx" });
productSchema.index({ category: 1 }, { name: "category_idx" });
productSchema.index({ productName: 1 }, { name: "product_name_idx" });
productSchema.index({ productName: "text" }, { name: "product_name_text_idx", weights: { productName: 10 } });
productSchema.index({ category: 1, price: -1 }, { name: "category_price_idx" });
productSchema.index({ category: 1, stockQuantity: 1 }, { name: "category_stock_idx" });

export type ProductRecord = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
