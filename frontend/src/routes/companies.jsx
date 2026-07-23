import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Building2, ChevronRight, Download, FileText, Filter, Mail, MoreHorizontal,
  Phone, Plus, Search, Upload, X, TrendingUp, DollarSign, Handshake, Pencil, Trash2, CheckCircle2, Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { companiesData as initialCompanies } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/companies")({
  component: CompaniesPage,
});

const industries = ["Textiles", "Electronics", "Pharmaceuticals", "Agriculture", "Automotive", "Chemicals", "Machinery", "Food & Beverage", "Metals", "Consumer Goods"];
const managers = ["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai", "Varun Iyer", "Zara Khan"];

function CompaniesPage() {
  const api = useApi();
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/companies");
      const data = res.data?.data || [];

      setCompaniesList(data.map(c => ({
        id: c.code || c._id,
        _id: c._id,
        name: c.name,
        industry: c.industry || "Textiles",
        primaryContact: c.primaryContact || "",
        phone: c.phone || "",
        email: c.email || "",
        assignedManager: c.assignedManager || "Nikhil Rao",
        activeDeals: c.activeDeals || 0,
        status: c.status || "Active",
        revenue: c.revenue ? `₹${(c.revenue / 100000).toFixed(1)}L` : "₹0",
        gstin: c.gstin || "",
        pan: c.pan || "",
        website: c.website || ""
      })));
    } catch (err) {
      console.error("Failed to load companies", err);
      setCompaniesList([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDeleteCompany = async (company) => {
    if (!confirm(`Delete company "${company.name}"?`)) return;
    try {
      if (company._id) {
        await api.delete(`/companies/${company._id}`);
      }
      setCompaniesList(prev => prev.filter(c => (c._id || c.id) !== (company._id || company.id)));
      setActive(null);
      setEditing(null);
      toast.success("Company deleted");
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/companies/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "companies.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Exported companies to CSV");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const filtered = useMemo(() => {
    return companiesList.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (industryFilter !== "All" && c.industry !== industryFilter) return false;
      if (managerFilter !== "All" && c.assignedManager !== managerFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(s) ||
          c.industry.toLowerCase().includes(s) ||
          c.primaryContact.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [companiesList, search, status, industryFilter, managerFilter]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accounts Directory</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Companies & Clients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} of {companiesList.length} accounts · Track organization profiles and contacts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer">
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
            >
              <Plus size={14} /> Add Company
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies, industry, contact…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Primary Contact</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Active Deals</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">Loading companies from MongoDB...</div>
                    </td>
                  </tr>
                ) : filtered.map((c) => (
                  <tr key={c._id || c.id} className="group hover:bg-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs dark:bg-indigo-500/10 dark:text-indigo-300">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{c.industry}</td>
                    <td className="px-4 py-3 text-xs font-medium">{c.primaryContact}</td>
                    <td className="px-4 py-3 text-xs">{c.assignedManager}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">{c.activeDeals}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium",
                        c.status === "Active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                      )}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteCompany(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openAdd && <AddCompanyModal onClose={() => setOpenAdd(false)} onSuccess={fetchCompanies} />}
    </AppLayout>
  );
}

function AddCompanyModal({ onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: industries[0],
    primaryContact: "",
    phone: "",
    email: "",
    assignedManager: managers[0],
    status: "Active",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/companies", formData);
      toast.success("Company created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create company error", err);
      toast.error(err.response?.data?.message || "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold">Add New Company</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Company Name *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Apex Global Ltd" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Industry *</label>
              <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none">
                {industries.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Primary Contact</label>
              <input value={formData.primaryContact} onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })} placeholder="e.g. Rajesh Kumar" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone</label>
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="info@apex.com" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />} Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
