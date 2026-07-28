import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Globe, Phone, Mail, Loader2, RefreshCw, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/companies")({
  component: EmployeeCompaniesPage,
});

const statusColors = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  Prospect: "bg-blue-100 text-blue-700 border-blue-200",
};

function EmployeeCompaniesPage() {
  const api = useApi();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/companies?search=${search}`);
      setCompanies(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Companies</h1>
            <p className="text-sm text-muted-foreground">{companies.length} companies assigned to you</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchCompanies} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search companies..."
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
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Industry</th>
                  <th className="px-5 py-3">Primary Contact</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3 text-center">Open Deals</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No companies assigned to you yet.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Your manager will assign companies to you from the Manager Portal.</p>
                    </td>
                  </tr>
                ) : (
                  companies.map((c) => (
                    <tr key={c._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold">{c.name}</div>
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                            <Globe size={10} /> {c.website.replace(/https?:\/\//, "").split("/")[0]}
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{c.industry || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{c.primaryContact || "—"}</td>
                      <td className="px-5 py-4">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="text-muted-foreground hover:text-indigo-600 flex items-center gap-1.5">
                            <Phone size={13} /> {c.phone}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-muted-foreground hover:text-indigo-600 flex items-center gap-1.5">
                            <Mail size={13} /> {c.email}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold">{c.openDeals || 0}</td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusColors[c.status] || "border-slate-200 bg-slate-50 text-slate-700")}>
                          {c.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
          <span className="font-semibold">ℹ️ Note:</span> Companies are assigned to you by your manager via the <strong>Manager Portal → Companies</strong>. Changes to company details (like adding contacts or editing info) must be done by the manager.
        </div>
      </div>
    </AppLayout>
  );
}
