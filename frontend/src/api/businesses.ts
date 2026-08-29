import { apiClient } from "./client";
import type { Business } from "./types";

export type BusinessUpdatePayload = Partial<Omit<Business, "id">>;

export async function updateBusiness(id: number, payload: BusinessUpdatePayload): Promise<Business> {
  const res = await apiClient.patch<Business>(`/api/businesses/${id}`, payload);
  return res.data;
}

export async function uploadBusinessLogo(id: number, file: File): Promise<Business> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<Business>(`/api/businesses/${id}/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
