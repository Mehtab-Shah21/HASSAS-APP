import { useEffect, useState } from "react";
import { getAttendanceTotals, getDayAttendance, markAttendance } from "../../api/attendance";
import type { AttendanceStatus, DayAttendanceEntry, EmployeeTotals } from "../../api/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-600 text-white",
  absent: "bg-red-500 text-white",
  leave: "bg-amber-500 text-white",
};

export default function AttendancePage() {
  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState<DayAttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [totals, setTotals] = useState<EmployeeTotals[]>([]);

  async function loadDay() {
    setLoading(true);
    try {
      setEntries(await getDayAttendance(date));
    } finally {
      setLoading(false);
    }
  }

  async function loadTotals() {
    setTotals(await getAttendanceTotals(dateFrom, dateTo));
  }

  useEffect(() => {
    loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    loadTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  async function handleMark(userId: number, status: AttendanceStatus) {
    await markAttendance(userId, date, status);
    loadDay();
    loadTotals();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Attendance</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-400">No employees found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-1.5">Employee</th>
                <th className="py-1.5">Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.user_id}>
                  <td className="py-2 font-medium text-slate-800">{e.user_name}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {(["present", "absent", "leave"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleMark(e.user_id, s)}
                          className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                            e.status === s ? STATUS_STYLES[s] : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Totals</h2>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
          <span className="text-sm text-slate-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
        </div>
        {totals.length === 0 ? (
          <p className="text-sm text-slate-400">No data.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-1.5">Employee</th>
                <th className="py-1.5 text-right">Present</th>
                <th className="py-1.5 text-right">Absent</th>
                <th className="py-1.5 text-right">Leave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {totals.map((t) => (
                <tr key={t.user_id}>
                  <td className="py-1.5 font-medium text-slate-800">{t.user_name}</td>
                  <td className="py-1.5 text-right text-emerald-600">{t.present}</td>
                  <td className="py-1.5 text-right text-red-600">{t.absent}</td>
                  <td className="py-1.5 text-right text-amber-600">{t.leave}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
