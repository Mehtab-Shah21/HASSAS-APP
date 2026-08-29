import { apiClient } from "./client";
import type { Customer, PaginatedCustomers } from "./types";

export interface ListCustomersParams {
  search?: string;
  type?: "individual" | "company";
  page?: number;
  page_size?: number;
  include_employees?: boolean;
}

export async function listCustomers(params: ListCustomersParams): Promise<PaginatedCustomers> {
  const res = await apiClient.get<PaginatedCustomers>("/api/customers", { params });
  return res.data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const res = await apiClient.get<Customer>(`/api/customers/${id}`);
  return res.data;
}

export async function listEmployees(customerId: number): Promise<Customer[]> {
  const res = await apiClient.get<Customer[]>(`/api/customers/${customerId}/employees`);
  return res.data;
}

export type CustomerPayload = Partial<Omit<Customer, "id" | "business_id">>;

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const res = await apiClient.post<Customer>("/api/customers", payload);
  return res.data;
}

export async function updateCustomer(id: number, payload: CustomerPayload): Promise<Customer> {
  const res = await apiClient.patch<Customer>(`/api/customers/${id}`, payload);
  return res.data;
}

export async function deactivateCustomer(id: number): Promise<void> {
  await apiClient.delete(`/api/customers/${id}`);
}
