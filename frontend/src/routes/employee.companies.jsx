import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Globe, Phone, Mail, Loader2, RefreshCw, Building2, Plus, Handshake
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { AddLeadModal } from "./leads";
import { AddDealModal } from "./deals";

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
  const [openAddLeadCompany, setOpenAddLeadCompany] = useState(null);
  const [openAddDealCompany, setOpenAddDealCompany] = useState(null);

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
            <h1 className="text-2xl font-bold tracking-tight">Companies Directory</h1>
            <p className="text-sm text-muted-foreground">{companies.length} companies available in workspace (Shared Directory)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchCompanies} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5 cursor-pointer">
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
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="8" className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No companies found in database.</p>
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
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setOpenAddLeadCompany(c.name)}
                            title="Make Lead for this Company"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            <Plus size={12} /> Lead
                          </button>
                          <button
                            onClick={() => setOpenAddDealCompany(c.name)}
                            title="Make Deal for this Company"
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-200 px-2 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100 transition cursor-pointer dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300"
                          >
                            <Handshake size={12} /> Deal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-500/10 dark:border-indigo-500/20 p-4 text-xs text-indigo-700 dark:text-indigo-300">
          <span className="font-semibold">ℹ️ Shared Company Directory:</span> All company records are shared across the workspace. You can create Leads, Deals, and Contacts for any company directly from this table!
        </div>
      </div>

      {/* Make Lead Modal for Company */}
      {openAddLeadCompany && (
        <AddLeadModal
          defaultCompany={openAddLeadCompany}
          onClose={() => setOpenAddLeadCompany(null)}
          onSuccess={fetchCompanies}
        />
      )}

      {/* Make Deal Modal for Company */}
      {openAddDealCompany && (
        <AddDealModal
          defaultCompany={openAddDealCompany}
          onClose={() => setOpenAddDealCompany(null)}
          onSuccess={fetchCompanies}
        />
      )}
    </AppLayout>
  );
}
