import { BarChart3, Boxes, Gauge, Menu, PackageSearch, X } from "lucide-react";

export type ViewName = "overview" | "inventory" | "analytics";

type SidebarProps = {
  activeView: ViewName;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNavigate: (view: ViewName) => void;
};

const items = [
  { id: "overview" as const, label: "Overview", icon: Gauge },
  { id: "inventory" as const, label: "Inventory", icon: Boxes },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ activeView, isOpen, onOpen, onClose, onNavigate }: SidebarProps) {
  return (
    <>
      <button
        className="mobile-menu-button"
        type="button"
        onClick={() => (isOpen ? onClose() : onOpen())}
        aria-label="Open navigation"
      >
        <Menu size={21} />
      </button>
      {isOpen && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <div className="brand-mark"><PackageSearch size={24} /></div>
          <div>
            <strong>Aura Engine</strong>
            <span>Inventory intelligence</span>
          </div>
          <button className="sidebar__close" type="button" onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          <span className="sidebar__eyebrow">Workspace</span>
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeView === id ? "is-active" : ""}
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar__status">
          <span className="status-dot" />
          <div>
            <strong>Operations online</strong>
            <span>Cloud inventory connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}
