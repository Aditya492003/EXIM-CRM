import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, X, FileText, Loader2, RefreshCw, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/employee/proposals")({
  component: EmployeeProposalsPage,
});

const proposalStatuses = ["Draft", "Sent", "Under Review", "Approved", "Rejected", "Expired"];

const proposalStatusColors = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Sent: "bg-blue-100 text-blue-700 border-blue-200",
  "Under Review": "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  Expired: "bg-orange-100 text-orange-700 border-orange-200",
};

function EmployeeProposalsPage() {
  const api = useApi();
  const [proposals, setProposals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/proposals?search=${search}`);
      setProposals(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleStatusChange = async (id, status) => {
    // Optimistic update
    setProposals(prev => prev.map(p => p._id === id ? { ...p, status } : p));
    try {
      await api.patch(`/proposals/${id}/status`, { status });
      toast.success(`Status updated to "${status}"`);
    } catch (error) {
      toast.error("Failed to update status — please try again");
      fetchProposals(); // revert
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Proposals</h1>
            <p className="text-sm text-muted-foreground">{proposals.length} proposals in your pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/proposals/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} /> Create Proposal
            </Link>
            <button onClick={fetchProposals} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search proposals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Proposal</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Valid Till</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : proposals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No proposals yet.</p>
                      <Link
                        to="/proposals/new"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <Plus size={13} /> Create your first proposal
                      </Link>
                    </td>
                  </tr>
                ) : (
                  proposals.map((p) => (
                    <tr key={p._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-indigo-600">{p.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{p.number}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{p.client || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{p.service || "—"}</td>
                      <td className="px-5 py-4 font-medium">
                        {p.value ? `₹${p.value.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-80 focus:outline-none transition", proposalStatusColors[p.status] || "border-slate-200 bg-slate-50 text-slate-700")}>
                              {p.status} <ChevronDown size={11} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {proposalStatuses.map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(p._id, s)}>
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {p.validTill ? new Date(p.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
