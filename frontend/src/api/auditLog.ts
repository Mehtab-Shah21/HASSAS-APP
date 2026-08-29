import { apiClient } from "./client";

export interface AuditLogEntry {
  id: number;
  created_at: string;
  business_id: number | null;
  user_id: number | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string | null;
  source_ip: string | null;
}

export interface PaginatedAuditLog {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuditLogParams {
  search?: string;
  entity_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export async function listAuditLog(params: AuditLogParams): Promise<PaginatedAuditLog> {
  const res = await apiClient.get<PaginatedAuditLog>("/api/audit-log", { params });
  return res.data;
}

export async function downloadAuditLogCsv(params: AuditLogParams) {
  const res = await apiClient.get("/api/audit-log/export", { params, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit_log.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
