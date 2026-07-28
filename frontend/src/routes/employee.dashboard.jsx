import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Handshake, FileText, Building2, ChevronDown, Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/dashboard")({
  component: EmployeeDashboard,
});

const WORKING_STATUSES = ["Available", "Working on Leads", "On Leave"];

const statusBadgeStyles = {
  Available: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
  "Working on Leads": "bg-blue-500/20 text-blue-100 border-blue-400/40",
  "On Leave": "bg-amber-500/20 text-amber-100 border-amber-400/40",
};

function EmployeeDashboard() {
  const { user } = useUser();
  const api = useApi();
  const firstName = user?.firstName || "Employee";
  const [stats, setStats] = useState({ leads: 0, deals: 0, companies: 0, proposals: 0 });
  const [profile, setProfile] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProfileAndStats = useCallback(async () => {
    try {
      const [lRes, dRes, cRes, pRes, profRes] = await Promise.all([
        api.get("/leads"),
        api.get("/deals"),
        api.get("/companies"),
        api.get("/proposals"),
        api.get("/employees/me").catch(() => null),
      ]);

      setStats({
        leads: lRes.data?.total || 0,
        deals: dRes.data?.total || 0,
        companies: cRes.data?.total || 0,
        proposals: pRes.data?.total || 0,
      });

      if (profRes?.data?.data) {
        setProfile(profRes.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [api]);

  useEffect(() => {
    fetchProfileAndStats();
  }, [fetchProfileAndStats]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.patch("/employees/status", { workingStatus: newStatus });
      if (res.data?.success) {
        setProfile(res.data.data);
        toast.success(`Status updated to "${newStatus}" — synced with Manager Portal!`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStatus = profile?.workingStatus || "Available";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <h1 className="mt-1 text-3xl font-bold">Welcome back, {profile?.name || firstName}</h1>

          {/* Interactive Working Status Selector */}
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-100">
            <span>Current Working Status:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={updatingStatus}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md hover:bg-white/20 transition cursor-pointer disabled:opacity-50",
                    statusBadgeStyles[currentStatus] || "bg-blue-500/20 text-white border-blue-300/30"
                  )}
                >
                  {updatingStatus ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>
                      <span className={cn("h-2 w-2 rounded-full", currentStatus === "Available" ? "bg-emerald-400" : currentStatus === "On Leave" ? "bg-amber-400" : "bg-blue-400")} />
                      {currentStatus}
                      <ChevronDown size={12} />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {WORKING_STATUSES.map((st) => (
                  <DropdownMenuItem key={st} onClick={() => handleStatusUpdate(st)} className="cursor-pointer">
                    <span className={cn("mr-2 h-2 w-2 rounded-full inline-block", st === "Available" ? "bg-emerald-500" : st === "On Leave" ? "bg-amber-500" : "bg-blue-500")} />
                    {st}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Assigned Companies" value={stats.companies} icon={Building2} color="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" />
          <StatCard title="Assigned Leads" value={stats.leads} icon={Users} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" />
          <StatCard title="Assigned Deals" value={stats.deals} icon={Handshake} color="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" />
          <StatCard title="Assigned Proposals" value={stats.proposals} icon={FileText} color="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" />
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`w-fit rounded-xl p-2.5 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
      </div>
    </div>
  );
}
