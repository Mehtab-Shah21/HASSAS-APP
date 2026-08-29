export function ReportToolbar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onExportCsv,
  showDates = true,
}: {
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (v: string) => void;
  onDateToChange?: (v: string) => void;
  onExportCsv: () => void;
  showDates?: boolean;
}) {
  return (
    <div className="no-print mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showDates && onDateFromChange && onDateToChange && (
          <>
            <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            <span className="text-sm text-slate-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onExportCsv} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Export CSV
        </button>
        <button onClick={() => window.print()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Print / PDF
        </button>
      </div>
    </div>
  );
}

export function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
export function today() {
  return new Date().toISOString().slice(0, 10);
}
