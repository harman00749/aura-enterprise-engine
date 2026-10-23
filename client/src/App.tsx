import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Download,
  PackagePlus,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { InventoryTable } from "./components/InventoryTable";
import { MetricCard } from "./components/MetricCard";
import { Pagination } from "./components/Pagination";
import { ProductModal } from "./components/ProductModal";
import { Sidebar, type ViewName } from "./components/Sidebar";
import { useAnalytics } from "./hooks/useAnalytics";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useInventory } from "./hooks/useInventory";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getExportUrl,
  updateProduct,
} from "./services/api";
import type { InventoryFilters, Product, ProductInput } from "./types/inventory";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

function App() {
  const [activeView, setActiveView] = useState<ViewName>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("-lastUpdated");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const filters = useMemo<InventoryFilters>(() => ({
    page,
    limit: 50,
    search: debouncedSearch,
    category,
    sort,
  }), [page, debouncedSearch, category, sort]);

  const inventory = useInventory(filters);
  const analytics = useAnalytics(category);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal).then(setCategories).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => setPage(1), [debouncedSearch, category, sort]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const refreshAll = () => {
    inventory.refresh();
    analytics.refresh();
    getCategories().then(setCategories).catch(() => undefined);
  };

  const saveProduct = async (input: ProductInput) => {
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, input);
        setToast("Product updated successfully.");
      } else {
        await createProduct(input);
        setToast("Product added to inventory.");
      }
      setModalOpen(false);
      setEditingProduct(null);
      refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product: Product) => {
    const confirmed = window.confirm(`Delete ${product.productName}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteProduct(product.id);
      setToast("Product deleted.");
      refreshAll();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to delete product.");
    }
  };

  const summary = analytics.result?.summary;
  const showInventory = activeView === "inventory" || activeView === "overview";
  const showAnalytics = activeView === "analytics" || activeView === "overview";

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        isOpen={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setActiveView}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Enterprise operations</span>
            <h1>{activeView === "overview" ? "Inventory command center" : activeView === "inventory" ? "Product inventory" : "Inventory analytics"}</h1>
            <p>{activeView === "analytics" ? "Live financial and stock insights calculated in MongoDB." : "Search, monitor, and act across the entire product catalog."}</p>
          </div>
          <div className="topbar__actions">
            <button className="icon-button" type="button" onClick={refreshAll} aria-label="Refresh data"><RefreshCw size={18} /></button>
            <button className="button button--primary" type="button" onClick={() => { setEditingProduct(null); setModalOpen(true); }}>
              <PackagePlus size={18} /> Add product
            </button>
          </div>
        </header>

        {(inventory.error || analytics.error) && (
          <div className="error-banner"><AlertTriangle size={18} /><span>{inventory.error || analytics.error}</span><button type="button" onClick={refreshAll}>Try again</button></div>
        )}

        <section className="metrics-grid" aria-label="Inventory summary">
          <MetricCard label="Catalog products" value={(summary?.totalProducts ?? 0).toLocaleString()} detail="Indexed inventory records" icon={Boxes} />
          <MetricCard label="Inventory value" value={money.format(summary?.inventoryValue ?? 0)} detail="Current retail valuation" icon={CircleDollarSign} tone="teal" />
          <MetricCard label="Low-stock SKUs" value={(summary?.lowStockProducts ?? 0).toLocaleString()} detail="At or below reorder level" icon={AlertTriangle} tone="amber" />
          <MetricCard label="Potential margin" value={money.format(summary?.potentialProfit ?? 0)} detail="Value less inventory cost" icon={TrendingUp} tone="violet" />
        </section>

        {showAnalytics && <AnalyticsPanel categories={analytics.result?.categories ?? []} loading={analytics.loading} />}

        {showInventory && (
          <section className="panel inventory-panel">
            <div className="panel__heading inventory-heading">
              <div>
                <span className="eyebrow">Optimized query engine</span>
                <h2>All inventory</h2>
                <p>Only 50 records are transferred per page.</p>
              </div>
              <button className="button button--secondary" type="button" onClick={() => window.location.assign(getExportUrl({ search: debouncedSearch, category, sort }))}>
                <Download size={17} /> Export CSV
              </button>
            </div>

            <div className="filters">
              <label className="search-field">
                <Search size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product name or exact SKU…" aria-label="Search inventory" />
              </label>
              <label>
                <span className="sr-only">Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Sort inventory</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="-lastUpdated">Recently updated</option>
                  <option value="productName">Name A–Z</option>
                  <option value="-price">Price high–low</option>
                  <option value="price">Price low–high</option>
                  <option value="stockQuantity">Stock low–high</option>
                </select>
              </label>
            </div>

            <InventoryTable
              products={inventory.result?.records ?? []}
              loading={inventory.loading}
              onEdit={(product) => { setEditingProduct(product); setModalOpen(true); }}
              onDelete={removeProduct}
            />
            {inventory.result && (
              <Pagination
                {...inventory.result.pagination}
                onPageChange={setPage}
              />
            )}
            <div className="query-performance">
              <span className="status-dot" /> Query completed in <strong>{inventory.result?.queryTimeMs ?? 0} ms</strong>
            </div>
          </section>
        )}
      </main>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          saving={saving}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
          onSave={saveProduct}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
