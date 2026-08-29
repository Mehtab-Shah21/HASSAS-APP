import { useEffect, useState } from "react";
import { downloadCsv, getVatReport, type VatReport } from "../../../api/reports";
import { monthStart, ReportToolbar, today } from "../ReportToolbar";

export default function VatReportTab() {
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [data, setData] = useState<VatReport | null>(null);

  useEffect(() => {
    getVatReport({ date_from: dateFrom, date_to: dateTo }).then(setData);
  }, [dateFrom, dateTo]);

  return (
    <div>
      <ReportToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onExportCsv={() => downloadCsv("/api/reports/vat", { date_from: dateFrom, date_to: dateTo }, "vat_collected.csv")}
      />
      {data && (
        <>
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-400">Total VAT collected</p>
            <p className="text-2xl font-semibold text-emerald-600">{data.total_vat.toFixed(2)}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="py-1.5">Number</th><th>Date</th><th>Customer</th><th className="text-right">VAT</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.number}><td className="py-1.5">{r.number}</td><td>{r.date}</td><td>{r.customer}</td><td className="text-right">{r.vat.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
