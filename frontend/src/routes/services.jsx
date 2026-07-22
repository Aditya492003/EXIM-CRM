import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Briefcase, CheckCircle2, Clock, Filter, IndianRupee, Layers, Plus,
  Search, Sparkles, TrendingUp, Users, X, Edit, Trash2, ArrowUpRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { servicesList } from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

const categories = ["All", "DGFT Advisory", "Capital Goods", "Export Benefit", "Compliance", "Special Economic Zones", "Customs Clearance", "Customs Certification", "Audit & Legal"];

function ServicesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    let out = servicesList;
    if (category !== "All") {
      out = out.filter((s) => s.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }
    return out;
  }, [category, search]);

  const kpis = [
    { label: "Total Services", value: servicesList.length, icon: Layers, tone: "from-indigo-500 to-violet-500" },
    { label: "Active Advisory Jobs", value: servicesList.reduce((a, c) => a + c.activeLeads, 0), icon: Briefcase, tone: "from-emerald-500 to-teal-500" },
    { label: "Completed Projects", value: servicesList.reduce((a, c) => a + c.completedJobs, 0), icon: CheckCircle2, tone: "from-blue-500 to-cyan-500" },
    { label: "Est. Service Revenue", value: "₹48.5L", icon: TrendingUp, tone: "from-amber-500 to-orange-500" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exim Advisory Services</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Services & Jobs Catalog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage export-import advisory offerings, active jobs, client assignments, and pricing structures.
            </p>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition"
          >
            <Plus size={14} /> Add New Service
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-2xl font-bold tracking-tight">{k.value}</div>
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services, category, or scope…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 5).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                    category === c ? "border-indigo-500 bg-indigo-500 text-white shadow-sm" : "border-border bg-card hover:border-indigo-300 hover:text-indigo-600"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-md text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Service Code</th>
                  <th className="px-4 py-3">Service / Job Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Standard Fee</th>
                  <th className="px-4 py-3">Active Leads / Jobs</th>
                  <th className="px-4 py-3">Completed Jobs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="group hover:bg-muted/40 transition">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-xs text-muted-foreground">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{s.category}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">{s.price}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold">{s.activeLeads}</span>
                        <span className="text-xs text-muted-foreground">leads</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground font-medium">{s.completedJobs} jobs</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                        <CheckCircle2 size={11} /> {s.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => setEditing(s)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600">
                          <Edit size={14} />
                        </button>
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      <Sparkles size={24} className="mx-auto text-muted-foreground/60" />
                      <div className="mt-2 font-medium text-sm">No services found</div>
                      <div className="text-xs mt-1">Try adjusting search or category filter.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openAdd && <ServiceModal onClose={() => setOpenAdd(false)} />}
      {editing && <ServiceModal service={editing} onClose={() => setEditing(null)} />}
    </AppLayout>
  );
}

function ServiceModal({ service, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">{service ? "Edit Service / Job" : "Add New Advisory Service"}</h2>
            <p className="text-xs text-muted-foreground">Configure pricing, category and description.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Service / Job Title *</label>
            <input required defaultValue={service?.name} placeholder="e.g. DGFT Advance Authorization" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Category *</label>
              <select defaultValue={service?.category ?? "DGFT Advisory"} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Standard Fee (₹) *</label>
              <input required defaultValue={service?.price} placeholder="e.g. ₹50,000" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Description & Scope</label>
            <textarea rows={3} defaultValue={service?.description} placeholder="Detail the scope of advisory work, timeline and deliverables…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">
              {service ? "Save Changes" : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
