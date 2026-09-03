import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { LandingPage } from "@/routes/landing";
import { EmployeeLayout } from "./EmployeeLayout";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useApi } from "@/lib/api";

export function AppLayout({ children }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const syncedRef = useRef(false);

  // Initialize push notification listener & token sync
  usePushNotifications();

  const api = useApi();

  useEffect(() => {
    async function sync() {
      if (isSignedIn && user?.publicMetadata?.role === "employee" && !syncedRef.current) {
        try {
          await api.post("/employees/sync");
          syncedRef.current = true;
        } catch (e) {
          console.error("Failed to sync employee record:", e);
        }
      }
    }
    sync();
  }, [isSignedIn, user, api]);

  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Loading Exim Nexus…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  // Check if user is an employee
  const isEmployee = user?.publicMetadata?.role === "employee";

  if (isEmployee) {
    return <EmployeeLayout>{children}</EmployeeLayout>;
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
