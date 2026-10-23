import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Product, ProductInput } from "../types/inventory";

type ProductModalProps = {
  product: Product | null;
  categories: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
};

const emptyProduct: ProductInput = {
  productName: "",
  sku: "",
  category: "",
  price: 0,
  cost: 0,
  stockQuantity: 0,
  reorderLevel: 10,
};

export function ProductModal({ product, categories, saving, onClose, onSave }: ProductModalProps) {
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(product ? {
      productName: product.productName,
      sku: product.sku,
      category: product.category,
      price: product.price,
      cost: product.cost,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
    } : emptyProduct);
    setError("");
  }, [product]);

  const update = (key: keyof ProductInput, value: string) => {
    const numericFields: Array<keyof ProductInput> = ["price", "cost", "stockQuantity", "reorderLevel"];
    setForm((current) => ({ ...current, [key]: numericFields.includes(key) ? Number(value) : value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.price < form.cost) {
      setError("Price cannot be lower than cost.");
      return;
    }
    if (form.stockQuantity < 0) {
      setError("Stock quantity cannot be negative.");
      return;
    }
    setError("");
    try {
      await onSave({ ...form, category: form.category.trim().toLowerCase(), sku: form.sku.trim().toUpperCase() });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save product.");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="modal__header">
          <div>
            <span className="eyebrow">Inventory record</span>
            <h2 id="product-modal-title">{product ? "Edit product" : "Add product"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="product-form">
          <label className="field field--wide">
            <span>Product name</span>
            <input required minLength={2} maxLength={120} value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder="Wireless inventory scanner" />
          </label>
          <label className="field">
            <span>SKU</span>
            <input required minLength={3} maxLength={40} value={form.sku} onChange={(event) => update("sku", event.target.value)} placeholder="AUR-0005001" />
          </label>
          <label className="field">
            <span>Category</span>
            <input required list="category-options" value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="electronics" />
            <datalist id="category-options">{categories.map((category) => <option key={category} value={category} />)}</datalist>
          </label>
          <label className="field">
            <span>Price (USD)</span>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} />
          </label>
          <label className="field">
            <span>Cost (USD)</span>
            <input required type="number" min="0" step="0.01" value={form.cost} onChange={(event) => update("cost", event.target.value)} />
          </label>
          <label className="field">
            <span>Stock quantity</span>
            <input required type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => update("stockQuantity", event.target.value)} />
          </label>
          <label className="field">
            <span>Reorder level</span>
            <input required type="number" min="0" step="1" value={form.reorderLevel} onChange={(event) => update("reorderLevel", event.target.value)} />
          </label>
          {error && <div className="form-error field--wide">{error}</div>}
          <div className="modal__actions field--wide">
            <button className="button button--secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button button--primary" type="submit" disabled={saving}>{saving ? "Saving…" : product ? "Save changes" : "Add product"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
