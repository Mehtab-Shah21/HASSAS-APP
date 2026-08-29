import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "../api/client";
import type { FeatureFlag } from "../api/types";
import { useAuth } from "./AuthContext";

interface FeatureFlagsContextValue {
  isEnabled: (key: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await apiClient.get<FeatureFlag[]>("/api/feature-flags");
    setFlags(Object.fromEntries(res.data.map((f) => [f.key, f.enabled])));
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = useMemo(
    () => ({
      isEnabled: (key: string) => flags[key] ?? true,
      loading,
      refresh: load,
    }),
    [flags, loading],
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return ctx;
}
