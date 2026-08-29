import { apiClient } from "./client";
import type { DashboardSummary } from "./types";

export async function getDashboardSummary(period: "month" | "year" | "all" = "month"): Promise<DashboardSummary> {
  const res = await apiClient.get<DashboardSummary>("/api/dashboard/summary", { params: { period } });
  return res.data;
}
