import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listQuotations } from "../../api/quotations";
import type { QuotationListItem, QuotationStatus } from "../../api/types";
import { useBusiness } from "../../context/BusinessContext";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<QuotationStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-indigo-100 text-indigo-700",
};

export default function QuotationsListPage() {
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();
  const [items, setItems] = useState<QuotationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "">("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await listQuotations({ search: search || undefined, status: status || undefined, page, page_size: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeBusiness) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?.id, page, search, status]);

  useEffect(() => {
    setPage(1);
  }, [search, status, activeBusiness?.id]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Quotations</h1>
        <button
          onClick={() => navigate("/quotations/new")}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Create quotation
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by number or customer..."
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuotationStatus | "")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Number</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Valid until</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No quotations yet.
                </td>
              </tr>
            ) : (
              items.map((q) => (
                <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{q.number}</td>
                  <td className="px-4 py-2 text-slate-600">{q.quotation_date}</td>
                  <td className="px-4 py-2 text-slate-600">{q.valid_until}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[q.status]}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-700">{q.grand_total.toFixed(2)}</td>
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
