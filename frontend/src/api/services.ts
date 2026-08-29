import { apiClient } from "./client";
import type { PaginatedServices, Service, ServiceCategory } from "./types";

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const res = await apiClient.get<ServiceCategory[]>("/api/service-categories");
  return res.data;
}

export type CategoryPayload = Partial<Omit<ServiceCategory, "id" | "business_id">>;

export async function createServiceCategory(payload: CategoryPayload): Promise<ServiceCategory> {
  const res = await apiClient.post<ServiceCategory>("/api/service-categories", payload);
  return res.data;
}

export async function updateServiceCategory(id: number, payload: CategoryPayload): Promise<ServiceCategory> {
  const res = await apiClient.patch<ServiceCategory>(`/api/service-categories/${id}`, payload);
  return res.data;
}

export async function deactivateServiceCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/service-categories/${id}`);
}

export interface ListServicesParams {
  search?: string;
  category_id?: number;
  active_only?: boolean;
  page?: number;
  page_size?: number;
}

export async function listServices(params: ListServicesParams): Promise<PaginatedServices> {
  const res = await apiClient.get<PaginatedServices>("/api/services", { params });
  return res.data;
}

export type ServicePayload = Partial<Omit<Service, "id" | "business_id">>;

export async function createService(payload: ServicePayload): Promise<Service> {
  const res = await apiClient.post<Service>("/api/services", payload);
  return res.data;
}

export async function updateService(id: number, payload: ServicePayload): Promise<Service> {
  const res = await apiClient.patch<Service>(`/api/services/${id}`, payload);
  return res.data;
}

export async function deactivateService(id: number): Promise<void> {
  await apiClient.delete(`/api/services/${id}`);
}
