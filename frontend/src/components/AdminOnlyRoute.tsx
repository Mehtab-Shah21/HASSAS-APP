import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import PlaceholderPage from "./PlaceholderPage";

export default function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <PlaceholderPage title="Admins only" />;
  }
  return <>{children}</>;
}
