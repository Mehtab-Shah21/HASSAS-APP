import { apiClient } from "./client";
import type { Coupon } from "./types";

export async function listCoupons(activeOnly = false): Promise<Coupon[]> {
  const res = await apiClient.get<Coupon[]>("/api/coupons", { params: { active_only: activeOnly } });
  return res.data;
}

export type CouponPayload = Partial<Omit<Coupon, "id" | "business_id">>;

export async function createCoupon(payload: CouponPayload): Promise<Coupon> {
  const res = await apiClient.post<Coupon>("/api/coupons", payload);
  return res.data;
}

export async function updateCoupon(id: number, payload: CouponPayload): Promise<Coupon> {
  const res = await apiClient.patch<Coupon>(`/api/coupons/${id}`, payload);
  return res.data;
}

export async function deactivateCoupon(id: number): Promise<void> {
  await apiClient.delete(`/api/coupons/${id}`);
}
