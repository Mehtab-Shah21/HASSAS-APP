import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBusiness } from "../context/BusinessContext";
import { useFeatureFlags } from "../context/FeatureFlagsContext";
import { useNotifications } from "../context/NotificationsContext";

interface NavItem {
  to: string;
  label: string;
  adminOnly?: boolean;
  flag?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/services", label: "Services" },
  { to: "/invoices", label: "Invoices" },
  { to: "/quotations", label: "Quotations" },
  { to: "/coupons", label: "Coupons", flag: "coupons" },
  { to: "/notifications", label: "Notifications", flag: "notifications" },
  { to: "/attendance", label: "Attendance", adminOnly: true, flag: "attendance" },
  { to: "/reports", label: "Reports", adminOnly: true },
  { to: "/audit-log", label: "Audit Log", adminOnly: true },
  { to: "/design-studio", label: "Design Studio", adminOnly: true, flag: "design_studio" },
  { to: "/settings", label: "Settings", adminOnly: true },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, setActiveBusinessId } = useBusiness();
  const { isEnabled } = useFeatureFlags();
  const { badgeCount } = useNotifications();

  const visibleBusinesses = businesses.filter((b) => b.name === "Main" || isEnabled("iim"));
  const visibleItems = NAV_ITEMS.filter(
    (item) => (!item.adminOnly || user?.role === "admin") && (!item.flag || isEnabled(item.flag)),
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <aside className="no-print flex w-60 shrink-0 flex-col bg-slate-900 text-slate-200">
        <div className="px-5 py-5 text-lg font-semibold text-white">PRO Invoicing</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span>{item.label}</span>
              {item.to === "/notifications" && badgeCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3 text-xs text-slate-400">v0.1 — foundation</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Business:</span>
            <select
              value={activeBusiness?.id ?? ""}
              onChange={(e) => setActiveBusinessId(Number(e.target.value))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              {visibleBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user?.display_name ?? user?.email}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
              {user?.role}
            </span>
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
