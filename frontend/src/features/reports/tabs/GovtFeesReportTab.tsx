import { useEffect, useState } from "react";
import { downloadCsv, getGovtFeesReport, type GovtFeesReport } from "../../../api/reports";
import { monthStart, ReportToolbar, today } from "../ReportToolbar";

export default function GovtFeesReportTab() {
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [data, setData] = useState<GovtFeesReport | null>(null);

  useEffect(() => {
    getGovtFeesReport({ date_from: dateFrom, date_to: dateTo }).then(setData);
  }, [dateFrom, dateTo]);

  return (
    <div>
      <ReportToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onExportCsv={() => downloadCsv("/api/reports/govt-fees", { date_from: dateFrom, date_to: dateTo }, "govt_fees.csv")}
      />
      {data && (
        <>
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-400">Total government fees</p>
            <p className="text-2xl font-semibold text-amber-600">{data.total_govt_fee.toFixed(2)}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="py-1.5">Number</th><th>Date</th><th>Customer</th><th className="text-right">Govt fee</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.number}><td className="py-1.5">{r.number}</td><td>{r.date}</td><td>{r.customer}</td><td className="text-right">{r.govt_fee.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
