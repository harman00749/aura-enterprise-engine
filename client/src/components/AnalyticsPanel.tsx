import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryAnalytics } from "../types/inventory";

type AnalyticsPanelProps = {
  categories: CategoryAnalytics[];
  loading: boolean;
};

const compactMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const colors = ["#4f6df5", "#13a8a8", "#8b5cf6", "#f59e0b", "#f05d75", "#3c91e6"];

export function AnalyticsPanel({ categories, loading }: AnalyticsPanelProps) {
  return (
    <section className="panel analytics-panel">
      <div className="panel__heading">
        <div>
          <span className="eyebrow">Real-time aggregation</span>
          <h2>Inventory value by category</h2>
        </div>
        <span className="aggregation-badge">MongoDB pipeline</span>
      </div>
      {loading ? (
        <div className="chart-skeleton" />
      ) : categories.length === 0 ? (
        <div className="empty-state compact"><p>No analytics data available yet.</p></div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories.slice(0, 8)} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5eaf2" />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(value: number) => compactMoney.format(value)} tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} width={64} />
              <Tooltip formatter={(value: number) => [compactMoney.format(value), "Valuation"]} cursor={{ fill: "#f2f5fa" }} />
              <Bar dataKey="inventoryValue" radius={[7, 7, 0, 0]} maxBarSize={52}>
                {categories.map((entry, index) => <Cell key={entry.category} fill={colors[index % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
