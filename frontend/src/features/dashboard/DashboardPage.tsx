import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../../api/dashboard";
import type { DashboardSummary } from "../../api/types";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();

  if (user?.role !== "admin") {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard businessId={activeBusiness?.id} businessName={activeBusiness?.name} navigate={navigate} />;
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Welcome, {user?.display_name ?? user?.email}</h1>
      <p className="mt-1 text-sm text-slate-500">Financial summaries are visible to admins only.</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate("/invoices/new")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Create invoice
        </button>
        <button
          onClick={() => navigate("/customers")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          + Add customer
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({
  businessId,
  businessName,
  navigate,
}: {
  businessId: number | undefined;
  businessName: string | undefined;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [period, setPeriod] = useState<"month" | "year" | "all">("month");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    getDashboardSummary(period)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [businessId, period]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{businessName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/invoices/new")} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + Create invoice
          </button>
          <button onClick={() => navigate("/customers")} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
            + Add customer
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(["month", "year", "all"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              period === p ? "bg-indigo-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p === "month" ? "This month" : p === "year" ? "This year" : "All time"}
          </button>
        ))}
      </div>

      {loading || !summary ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <KpiCard label="Total sales" value={summary.total_sales} sub={`${summary.invoice_count} invoices`} />
            <KpiCard label="Government fees paid to date" value={summary.govt_fees_paid_to_date} accent="text-amber-600" />
            <KpiCard label="VAT collected" value={summary.vat_collected} accent="text-emerald-600" />
          </div>

          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">Attendance today</h2>
            {summary.attendance_present_today === null ? (
              <p className="text-sm text-slate-400">Attendance module is off or not yet used today.</p>
            ) : (
              <p className="text-sm text-slate-600">
                {summary.attendance_present_today} present · {summary.attendance_absent_today} absent
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Recent invoices</h2>
              {summary.recent_invoices.length === 0 ? (
                <p className="text-sm text-slate-400">No invoices yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {summary.recent_invoices.map((inv) => (
                      <tr key={inv.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <td className="py-1.5 font-medium text-slate-800">{inv.number}</td>
                        <td className="py-1.5 text-slate-600">{inv.customer_name}</td>
                        <td className="py-1.5 text-slate-500">{inv.invoice_date}</td>
                        <td className="py-1.5 text-right text-slate-700">{inv.grand_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Top customers</h2>
              {summary.top_customers.length === 0 ? (
                <p className="text-sm text-slate-400">No data yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {summary.top_customers.map((c) => (
                      <tr key={c.customer_id}>
                        <td className="py-1.5 font-medium text-slate-800">{c.customer_name}</td>
                        <td className="py-1.5 text-slate-500">{c.invoice_count} invoices</td>
                        <td className="py-1.5 text-right text-slate-700">{c.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className={`text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value.toFixed(2)}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
