import { AlertTriangle, Edit3, PackageX, Trash2 } from "lucide-react";
import type { Product } from "../types/inventory";

type InventoryTableProps = {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function InventoryTable({ products, loading, onEdit, onDelete }: InventoryTableProps) {
  if (loading) {
    return (
      <div className="table-skeleton" aria-label="Loading inventory">
        {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div><PackageX size={28} /></div>
        <h3>No inventory matched</h3>
        <p>Clear the filters or add a new product to this catalog.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Cost</th>
            <th>Stock</th>
            <th>Updated</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLow = product.stockQuantity <= product.reorderLevel;
            return (
              <tr key={product.id}>
                <td><strong>{product.productName}</strong></td>
                <td><code>{product.sku}</code></td>
                <td><span className="category-pill">{product.category}</span></td>
                <td>{money.format(product.price)}</td>
                <td>{money.format(product.cost)}</td>
                <td>
                  <span className={`stock-pill ${isLow ? "stock-pill--low" : ""}`}>
                    {isLow && <AlertTriangle size={13} />}
                    {product.stockQuantity.toLocaleString()}
                  </span>
                </td>
                <td>{new Date(product.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" onClick={() => onEdit(product)} aria-label={`Edit ${product.productName}`}><Edit3 size={16} /></button>
                    <button className="danger" type="button" onClick={() => onDelete(product)} aria-label={`Delete ${product.productName}`}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
