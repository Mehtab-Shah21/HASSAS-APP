import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoiceKpis, listInvoices } from "../../api/invoices";
import type { InvoiceKpis, InvoiceListItem, InvoiceStatus } from "../../api/types";
import { useBusiness } from "../../context/BusinessContext";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-slate-200 text-slate-500 line-through",
};

export default function InvoicesListPage() {
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<InvoiceKpis | null>(null);
  const [items, setItems] = useState<InvoiceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [kpiRes, listRes] = await Promise.all([
        getInvoiceKpis({ date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        listInvoices({
          search: search || undefined,
          status: status || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          page_size: PAGE_SIZE,
        }),
      ]);
      setKpis(kpiRes);
      setItems(listRes.items);
      setTotal(listRes.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeBusiness) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?.id, page, search, status, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
  }, [search, status, dateFrom, dateTo, activeBusiness?.id]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
        <button
          onClick={() => navigate("/invoices/new")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Create invoice
        </button>
      </div>

      {kpis && (
        <div className="mb-5 grid grid-cols-5 gap-3">
          <KpiCard label="Total" count={kpis.total_count} amount={kpis.total_amount} />
          <KpiCard label="Pending" count={kpis.pending_count} amount={kpis.pending_amount} accent="text-blue-600" />
          <KpiCard label="Paid" count={kpis.paid_count} amount={kpis.paid_amount} accent="text-emerald-600" />
          <KpiCard label="Overdue" count={kpis.overdue_count} amount={kpis.overdue_amount} accent="text-red-600" />
          <KpiCard label="Void" count={kpis.void_count} amount={kpis.void_amount} accent="text-slate-400" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by number or customer..."
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus | "")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="void">Void</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <span className="self-center text-sm text-slate-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No invoices yet. Click "Create invoice" to make one.
                </td>
              </tr>
            ) : (
              items.map((inv) => (
                <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{inv.number}</td>
                  <td className="px-4 py-2 text-slate-600">{inv.invoice_date}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{inv.transaction_type}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-700">{inv.grand_total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{inv.amount_paid.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40">
              Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, count, amount, accent }: { label: string; count: number; amount: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${accent ?? "text-slate-900"}`}>{amount.toFixed(2)}</p>
      <p className="text-xs text-slate-400">{count} invoice{count === 1 ? "" : "s"}</p>
    </div>
  );
}
