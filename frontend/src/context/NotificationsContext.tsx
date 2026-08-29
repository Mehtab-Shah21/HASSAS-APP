import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getBadgeCount } from "../api/notifications";
import { useAuth } from "./AuthContext";
import { useBusiness } from "./BusinessContext";
import { useFeatureFlags } from "./FeatureFlagsContext";

interface NotificationsContextValue {
  badgeCount: number;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const { isEnabled } = useFeatureFlags();
  const [badgeCount, setBadgeCount] = useState(0);

  async function refresh() {
    if (!user || !activeBusiness || !isEnabled("notifications")) {
      setBadgeCount(0);
      return;
    }
    try {
      setBadgeCount(await getBadgeCount());
    } catch {
      // non-critical; leave badge as-is
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeBusiness?.id]);

  const value = useMemo(() => ({ badgeCount, refresh }), [badgeCount]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
