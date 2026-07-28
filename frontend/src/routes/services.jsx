import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Briefcase, CheckCircle2, Clock, Filter, IndianRupee, Layers, Plus,
  Search, Sparkles, TrendingUp, Users, X, Edit, Trash2, ArrowUpRight, Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

const categories = ["All", "DGFT Advisory", "Capital Goods", "Export Benefit", "Compliance", "Special Economic Zones", "Customs Clearance", "Customs Certification", "Audit & Legal"];

function ServicesPage() {
  const api = useApi();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      let data = res.data?.data || [];
      setServices(data.map(s => {
        const numVal = s.price ?? s.fee ?? 0;
        return {
          id: s.code || s._id,
          _id: s._id,
          name: s.name,
          category: s.category,
          price: `₹${numVal.toLocaleString("en-IN")}`,
          fee: numVal,
          description: s.description || "",
          activeLeads: s.activeJobsCount || s.activeLeads || 0,
          completedJobs: s.completedJobsCount || s.completedJobs || 0,
          status: s.status || "Active"
        };
      }));
    } catch (err) {
      console.error("Failed to load services", err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = async (service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;
    try {
      if (service._id) {
        await api.delete(`/services/${service._id}`);
      }
      setServices((prev) => prev.filter((s) => s._id !== service._id));
      toast.success("Service deleted successfully");
    } catch (err) {
      toast.error("Failed to delete service");
    }
  };

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || s.category === category;
      return matchSearch && matchCategory;
    });
  }, [services, search, category]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portfolio</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Services & Advisory Jobs</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage service catalog, standard pricing, and track active jobs across clients.</p>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus size={14} /> Add New Service
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Layers} label="Total Services" value={services.length} sub="Active catalog" color="indigo" />
          <StatCard icon={Briefcase} label="Active Categories" value={new Set(services.map(s => s.category)).size} sub="Service divisions" color="emerald" />
          <StatCard icon={TrendingUp} label="Catalog Categories" value={categories.length - 1} sub="Available sectors" color="blue" />
          <StatCard icon={CheckCircle2} label="Published Services" value={services.filter(s => s.status === "Active").length} sub="Ready for proposals" color="amber" />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search services by title or scope..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                    category === cat ? "bg-indigo-600 text-white shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Service Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Standard Fee</th>
                  <th className="px-4 py-3 text-center">Active Jobs</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : filtered.map((s) => (
                  <tr key={s._id || s.id} className="hover:bg-muted/40 transition group">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-muted-foreground">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground text-sm">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{s.description || "No scope specified"}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        {s.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{s.price}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center font-bold text-amber-600">{s.activeLeads}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center font-bold text-emerald-600">{s.completedJobs}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <CheckCircle2 size={11} /> {s.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => setEditing(s)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(s)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openAdd && <ServiceModal onClose={() => setOpenAdd(false)} onSuccess={fetchServices} />}
      {editing && <ServiceModal service={editing} onClose={() => setEditing(null)} onSuccess={fetchServices} />}
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colorMap = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    amber: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <div className={cn("rounded-xl border p-2", colorMap[color] || colorMap.indigo)}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function ServiceModal({ service, onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const initialFee = service?.fee !== undefined && service?.fee !== null ? String(service.fee) : (service?.price ? String(service.price).replace(/[^\d]/g, '') : "");
  
  const [formData, setFormData] = useState({
    name: service?.name || "",
    category: service?.category || "DGFT Advisory",
    fee: initialFee,
    description: service?.description || "",
    code: service?.code || service?.id || `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const numericPrice = parseFloat(formData.fee) || 0;
      const payload = {
        name: formData.name,
        category: formData.category,
        price: numericPrice,
        fee: numericPrice,
        description: formData.description,
        code: formData.code,
      };

      if (service?._id) {
        await api.put(`/services/${service._id}`, payload);
        toast.success("Service updated successfully");
      } else {
        await api.post("/services", payload);
        toast.success("Service created successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Save service error", err);
      toast.error(err.response?.data?.message || "Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">{service ? "Edit Service / Job" : "Add New Advisory Service"}</h2>
            <p className="text-xs text-muted-foreground">Configure pricing, category and description.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Service / Job Title *</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. DGFT Advance Authorization"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
              >
                {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Standard Fee (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                placeholder="e.g. 50000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Description & Scope</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail the scope of advisory work, timeline and deliverables…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {service ? "Save Changes" : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
