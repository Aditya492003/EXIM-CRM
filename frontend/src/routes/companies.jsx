import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2, ChevronRight, Download, FileText, Filter, Mail, MoreHorizontal,
  Phone, Plus, Search, Upload, X, TrendingUp, DollarSign, Handshake, Pencil, Trash2, CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { companiesData as initialCompanies, deals, activities } from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/companies")({
  component: CompaniesPage,
});

const industries = ["Textiles", "Electronics", "Pharmaceuticals", "Agriculture", "Automotive", "Chemicals", "Machinery", "Food & Beverage", "Metals", "Consumer Goods"];
const managers = ["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai", "Varun Iyer", "Zara Khan"];

function CompaniesPage() {
  const [companiesList, setCompaniesList] = useState(initialCompanies);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [managerFilter, setManagerFilter] = useState("All");
  const [openFilter, setOpenFilter] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

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

  const handleAddCompany = (newCompany) => {
    setCompaniesList((prev) => [newCompany, ...prev]);
    setOpenAdd(false);
  };

  const handleUpdateCompany = (updated) => {
    setCompaniesList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditing(null);
    if (active && active.id === updated.id) {
      setActive(updated);
    }
  };

  const handleDeleteCompany = (id) => {
    setCompaniesList((prev) => prev.filter((c) => c.id !== id));
    setActive(null);
    setEditing(null);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Company Name", "Industry", "Primary Contact", "Phone", "Email", "Manager", "Active Deals", "Status", "Revenue"];
    const rows = filtered.map((c) => [c.id, c.name, c.industry, c.primaryContact, c.phone, c.email, c.assignedManager, c.activeDeals, c.status, c.revenue]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `companies_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Imported ${file.name} successfully! (Mock import demo)`);
    }
  };

  const resetFilters = () => {
    setStatus("All");
    setIndustryFilter("All");
    setManagerFilter("All");
    setSearch("");
  };

  const hasActiveFilters = status !== "All" || industryFilter !== "All" || managerFilter !== "All" || search !== "";

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accounts</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Companies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} companies · {companiesList.filter((c) => c.status === "Active").length} active accounts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOpenFilter(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition",
                hasActiveFilters ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-border bg-card hover:bg-muted",
              )}
            >
              <Filter size={14} /> Filter {hasActiveFilters && "•"}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted">
              <Upload size={14} /> Import
              <input type="file" accept=".csv,.xlsx" onChange={handleImportFile} className="hidden" />
            </label>
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted">
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition"
            >
              <Plus size={14} /> Add Company
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Companies", value: companiesList.length, icon: Building2, tone: "from-indigo-500 to-blue-500" },
            { label: "Active Accounts", value: companiesList.filter((c) => c.status === "Active").length, icon: TrendingUp, tone: "from-emerald-500 to-teal-500" },
            { label: "Total Active Deals", value: companiesList.reduce((s, c) => s + c.activeDeals, 0), icon: Handshake, tone: "from-amber-500 to-orange-500" },
            { label: "Revenue Generated", value: `₹${(companiesList.reduce((s, c) => s + c.revenue, 0) / 100000).toFixed(1)}L`, icon: DollarSign, tone: "from-rose-500 to-pink-500" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-0.5 text-2xl font-bold">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar and Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies, industry, contact…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
              {["All", "Active", "Prospect", "Inactive"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn("rounded-lg px-3 py-1 text-xs font-medium transition", status === s ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  {s}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-xs text-indigo-600 hover:underline px-1">
                Reset
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {["Company", "Industry", "Primary Contact", "Phone", "Email", "Manager", "Active Deals", "Status", "Created", "Actions"].map((c) => (
                    <th key={c} className="whitespace-nowrap px-4 py-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setActive(c)} className="group cursor-pointer border-t border-border transition hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-sm">
                          {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">{c.industry}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{c.primaryContact}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={c.assignedManager} size="xs" />
                        <span className="text-xs">{c.assignedManager.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {c.activeDeals} deals
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                          c.status === "Active" && "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
                          c.status === "Prospect" && "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
                          c.status === "Inactive" && "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30",
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {c.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">{c.createdDate}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setEditing(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteCompany(c.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-muted-foreground">
                      No companies match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {openFilter && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpenFilter(false)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl animate-slide-in-right">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold">Filter Companies</h2>
                <p className="text-xs text-muted-foreground">Filter account list by status, industry & manager.</p>
              </div>
              <button onClick={() => setOpenFilter(false)} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold">Account Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {["All", "Active", "Prospect", "Inactive"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        status === s ? "border-indigo-500 bg-indigo-500 text-white" : "border-border bg-background hover:border-indigo-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">Industry</label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="All">All Industries</option>
                  {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">Assigned Manager</label>
                <select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="All">All Managers</option>
                  {managers.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-2 border-t border-border pt-4">
              <button onClick={resetFilters} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted">Reset</button>
              <button onClick={() => setOpenFilter(false)} className="flex-1 rounded-xl bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-600">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {openAdd && (
        <CompanyModal onClose={() => setOpenAdd(false)} onSave={handleAddCompany} />
      )}

      {/* Edit Company Modal */}
      {editing && (
        <CompanyModal company={editing} onClose={() => setEditing(null)} onSave={handleUpdateCompany} />
      )}

      {/* Company Detail Drawer */}
      {active && (
        <CompanyDetail
          company={active}
          onClose={() => setActive(null)}
          onEdit={(c) => {
            setActive(null);
            setEditing(c);
          }}
          onDelete={() => handleDeleteCompany(active.id)}
        />
      )}
    </AppLayout>
  );
}

function CompanyModal({ company, onClose, onSave }) {
  const [name, setName] = useState(company?.name ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? "Textiles");
  const [primaryContact, setPrimaryContact] = useState(company?.primaryContact ?? "");
  const [phone, setPhone] = useState(company?.phone ?? "+91 98765 43210");
  const [email, setEmail] = useState(company?.email ?? "");
  const [assignedManager, setAssignedManager] = useState(company?.assignedManager ?? "Nikhil Rao");
  const [status, setStatus] = useState(company?.status ?? "Active");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: company?.id ?? `C-${Math.floor(2000 + Math.random() * 8000)}`,
      name,
      industry,
      primaryContact,
      phone,
      email: email || `contact@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8)}.com`,
      assignedManager,
      activeDeals: company?.activeDeals ?? 2,
      status,
      createdDate: company?.createdDate ?? new Date().toISOString().slice(0, 10),
      revenue: company?.revenue ?? 500000,
      wonDeals: company?.wonDeals ?? 1,
      openDeals: company?.openDeals ?? 2,
      lostDeals: company?.lostDeals ?? 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">{company ? "Edit Company Account" : "Add New Company"}</h2>
            <p className="text-xs text-muted-foreground">Register an export-import client company.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Company Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Global Trade" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Industry *</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {industries.map((ind) => <option key={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Account Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {["Active", "Prospect", "Inactive"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Primary Contact *</label>
              <input required value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} placeholder="e.g. Aarav Sharma" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Assigned Manager</label>
              <select value={assignedManager} onChange={(e) => setAssignedManager(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {managers.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 12345" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@company.com" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">
              {company ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyDetail({ company, onClose, onEdit, onDelete }) {
  const [tab, setTab] = useState("overview");
  const tabs = ["overview", "contacts", "deals", "timeline", "notes", "documents"];
  const companyDeals = deals.filter((_, i) => i < company.activeDeals + 2).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-3xl overflow-y-auto bg-background shadow-2xl animate-slide-in-right">
        <div className="relative border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent" />
          <div className="relative flex items-start gap-4 p-6">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
              {company.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="truncate text-2xl font-bold">{company.name}</h2>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onEdit(company)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-500/10">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{company.industry}</span><span>·</span>
                <span>{company.email}</span><span>·</span>
                <span>{company.phone}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <a href={`tel:${company.phone}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-muted">
                  <Phone size={12} /> Call
                </a>
                <a href={`mailto:${company.email}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-muted">
                  <Mail size={12} /> Email
                </a>
                <button onClick={() => setTab("notes")} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-muted">
                  <FileText size={12} /> Add Note
                </button>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="relative grid grid-cols-2 gap-3 p-6 pt-0 sm:grid-cols-5">
            {[
              { label: "Total Deals", value: company.wonDeals + company.openDeals + company.lostDeals },
              { label: "Won", value: company.wonDeals, tone: "text-emerald-600" },
              { label: "Open", value: company.openDeals, tone: "text-indigo-600" },
              { label: "Lost", value: company.lostDeals, tone: "text-rose-600" },
              { label: "Revenue", value: `₹${(company.revenue / 100000).toFixed(1)}L`, tone: "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card/60 p-3 backdrop-blur">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className={cn("mt-0.5 text-lg font-bold", s.tone)}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="relative flex gap-1 overflow-x-auto px-4">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition",
                  tab === t ? "border-indigo-500 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 text-sm font-semibold">Company Info</div>
                {[
                  ["Industry", company.industry],
                  ["Primary Contact", company.primaryContact],
                  ["Assigned Manager", company.assignedManager],
                  ["Account Status", company.status],
                  ["Created Date", company.createdDate],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between border-b border-border/60 py-2 text-xs last:border-0">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 text-sm font-semibold">Recent Activity</div>
                <ol className="space-y-3">
                  {activities.slice(0, 4).map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">{a.title}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{a.subtitle} · {a.time}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {tab === "deals" && (
            <div className="space-y-2">
              {companyDeals.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition hover:shadow-sm">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                    <Handshake size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.stage} · Close by {d.expectedClose}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">₹{d.value.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-muted-foreground">{d.owner.split(" ")[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "contacts" && (
            <div className="space-y-2">
              {[company.primaryContact, "Priya Sharma", "Vikram Iyer"].map((n) => (
                <div key={n} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <UserAvatar name={n} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{n}</div>
                    <div className="text-[11px] text-muted-foreground">Contact at {company.name}</div>
                  </div>
                  <a href={`mailto:${company.email}`} className="rounded-lg p-1.5 hover:bg-muted"><Mail size={14} /></a>
                  <a href={`tel:${company.phone}`} className="rounded-lg p-1.5 hover:bg-muted"><Phone size={14} /></a>
                </div>
              ))}
            </div>
          )}

          {["timeline", "notes", "documents"].includes(tab) && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
                <FileText size={18} className="text-muted-foreground" />
              </div>
              <div className="mt-3 text-sm font-semibold capitalize">No {tab} yet</div>
              <div className="mt-1 text-xs text-muted-foreground">Add the first {tab.slice(0, -1)} for this company account.</div>
              <button className="mt-4 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white">Add {tab.slice(0, -1)}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
