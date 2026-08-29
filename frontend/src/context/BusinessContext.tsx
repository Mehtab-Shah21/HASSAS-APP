import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "../api/client";
import type { Business } from "../api/types";
import { useAuth } from "./AuthContext";

interface BusinessContextValue {
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusinessId: (id: number) => void;
  loading: boolean;
  refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("active_business_id");
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = useCallback(async () => {
    const res = await apiClient.get<Business[]>("/api/businesses");
    setBusinesses(res.data);
    setActiveBusinessIdState((current) => {
      if (current && res.data.some((b) => b.id === current)) return current;
      const main = res.data.find((b) => b.name === "Main") ?? res.data[0];
      return main ? main.id : null;
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchBusinesses().finally(() => setLoading(false));
  }, [user, fetchBusinesses]);

  useEffect(() => {
    if (activeBusinessId) {
      localStorage.setItem("active_business_id", String(activeBusinessId));
    }
  }, [activeBusinessId]);

  const setActiveBusinessId = useCallback((id: number) => {
    setActiveBusinessIdState(id);
  }, []);

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId],
  );

  const value = useMemo(
    () => ({ businesses, activeBusiness, setActiveBusinessId, loading, refreshBusinesses: fetchBusinesses }),
    [businesses, activeBusiness, setActiveBusinessId, loading, fetchBusinesses],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
