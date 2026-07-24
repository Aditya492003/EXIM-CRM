import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Calendar, DollarSign, Filter, Handshake, LayoutGrid, List, Plus, Search, X,
  MoreHorizontal, GripVertical, FileText, Clock, StickyNote, Video, Pencil, Trash2, CheckCircle2, ChevronRight, Loader2, Building2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { deals as dummyDeals, stageColors } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const stages = ["New", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const priorities = ["Low", "Medium", "High"];
const owners = ["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai", "Varun Iyer", "Zara Khan"];
const quickFilters = ["All Deals", "High Priority", "My Deals", "Proposal Sent", "Negotiation", "Won Deals"];

function DealsPage() {
  const api = useApi();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [dragMongoId, setDragMongoId] = useState(null);
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("All Deals");

  // Advanced Filter state
  const [openFilter, setOpenFilter] = useState(false);
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");

  // Add Deal Modal state
  const [openAdd, setOpenAdd] = useState(false);
  const [addDefaultStage, setAddDefaultStage] = useState("New");

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/deals");
      const data = res.data?.data || [];

      setDeals(data.map(d => ({
        id: d.code || d._id,
        _id: d._id,
        name: d.name,
        company: d.company,
        value: d.value || 0,
        stage: d.stage || "New",
        priority: d.priority || "Medium",
        owner: d.assignedTo || "Nikhil Rao",
        expectedClose: d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString("en-IN") : "",
        probability: d.probability || 50,
        service: d.service || "",
        notes: d.notes || ""
      })));
    } catch (err) {
      console.error("Failed to load deals", err);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const filtered = useMemo(() => {
    let out = deals;

    if (stageFilter !== "All") out = out.filter((d) => d.stage === stageFilter);
    if (priorityFilter !== "All") out = out.filter((d) => d.priority === priorityFilter);
    if (ownerFilter !== "All") out = out.filter((d) => d.owner === ownerFilter);

    if (quick === "High Priority") out = out.filter((d) => d.priority === "High");
    if (quick === "My Deals") out = out.filter((d) => d.owner === "Nikhil Rao");
    if (quick === "Proposal Sent") out = out.filter((d) => d.stage === "Proposal Sent");
    if (quick === "Negotiation") out = out.filter((d) => d.stage === "Negotiation");
    if (quick === "Won Deals") out = out.filter((d) => d.stage === "Won");

    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (d) => d.name.toLowerCase().includes(s) || d.company.toLowerCase().includes(s) || d.owner.toLowerCase().includes(s),
      );
    }
    return out;
  }, [deals, stageFilter, priorityFilter, ownerFilter, quick, search]);

  const byStage = (st) => filtered.filter((d) => d.stage === st);
  const totalValue = filtered.reduce((s, d) => s + d.value, 0);

  // Drag and drop / inline stage change saved immediately in DB
  const handleStageChange = async (targetId, mongoId, newStage) => {
    setDeals((prev) => prev.map((d) => (d.id === targetId ? { ...d, stage: newStage } : d)));
    if (mongoId) {
      try {
        await api.patch(`/deals/${mongoId}/stage`, { stage: newStage });
        toast.success(`Deal moved to ${newStage}`);
      } catch (err) {
        toast.error("Failed to update deal stage");
        fetchDeals();
      }
    }
  };

  const onDrop = (newStage) => {
    if (!dragId) return;
    handleStageChange(dragId, dragMongoId, newStage);
    setDragId(null);
    setDragMongoId(null);
  };

  const handleDeleteDeal = async (deal) => {
    if (!confirm(`Delete deal "${deal.name}"?`)) return;
    try {
      if (deal._id) {
        await api.delete(`/deals/${deal._id}`);
      }
      setDeals((prev) => prev.filter((d) => (d._id || d.id) !== (deal._id || deal.id)));
      setActive(null);
      setEditing(null);
      toast.success("Deal deleted");
    } catch (err) {
      toast.error("Failed to delete deal");
    }
  };

  const resetFilters = () => {
    setStageFilter("All");
    setPriorityFilter("All");
    setOwnerFilter("All");
    setSearch("");
    setQuick("All Deals");
  };

  const activeFiltersCount = (stageFilter !== "All" ? 1 : 0) + (priorityFilter !== "All" ? 1 : 0) + (ownerFilter !== "All" ? 1 : 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deal Pipeline</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Deals & Opportunities</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} active deals · Pipeline Value: <span className="font-semibold text-foreground">₹{(totalValue / 100000).toFixed(1)}L</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-card p-1">
              <button onClick={() => setView("kanban")} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer", view === "kanban" ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid size={13} /> Kanban
              </button>
              <button onClick={() => setView("list")} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer", view === "list" ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-foreground")}>
                <List size={13} /> List
              </button>
            </div>
            <button
              onClick={() => { setAddDefaultStage("New"); setOpenAdd(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
            >
              <Plus size={14} /> Add Deal
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
          {quickFilters.map((q) => (
            <button
              key={q}
              onClick={() => setQuick(q)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap",
                quick === q ? "bg-indigo-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals, company, owner…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
            <div className="mt-2 text-sm">Loading deal pipeline from MongoDB...</div>
          </div>
        ) : view === "kanban" ? (
          <div className="flex gap-3 overflow-x-auto pb-4 items-start">
            {stages.map((st) => {
              const list = byStage(st);
              const val = list.reduce((a, b) => a + b.value, 0);
              return (
                <div
                  key={st}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(st)}
                  className="flex flex-col rounded-2xl border border-border bg-card p-2.5 shrink-0 w-[185px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[11px] font-bold truncate">{st}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold shrink-0 ml-1">{list.length}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-muted-foreground">₹{(val / 100000).toFixed(1)}L</div>

                  {/* Cards */}
                  <div className="mt-2 flex flex-col gap-2 min-h-[80px]">
                    {list.map((d) => (
                      <div
                        key={d._id || d.id}
                        draggable
                        onDragStart={() => { setDragId(d.id); setDragMongoId(d._id); }}
                        onClick={() => setActive(d)}
                        className="rounded-xl border border-border bg-background px-2.5 py-2 shadow-sm hover:border-indigo-400 hover:shadow-md transition cursor-grab active:cursor-grabbing"
                      >
                        <div className="font-semibold text-[11px] text-foreground line-clamp-1 leading-tight">{d.name}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{d.company}</div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-600">₹{(d.value / 100000).toFixed(1)}L</span>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[60px] text-right">{d.owner?.split(" ")[0]}</span>
                        </div>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <div className="grid h-16 place-items-center rounded-xl border border-dashed border-border text-[10px] text-muted-foreground">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Deal Name</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => (
                  <tr key={d._id || d.id} className="hover:bg-muted/40 transition">
                    <td className="px-4 py-3 font-semibold">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.company}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">₹{(d.value / 100000).toFixed(1)}L</td>
                    <td className="px-4 py-3">
                      <select
                        value={d.stage}
                        onChange={(e) => handleStageChange(d.id, d._id, e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                      >
                        {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs">{d.priority}</td>
                    <td className="px-4 py-3 text-xs">{d.owner}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteDeal(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openAdd && <AddDealModal defaultStage={addDefaultStage} onClose={() => setOpenAdd(false)} onSuccess={fetchDeals} />}
    </AppLayout>
  );
}

function EmployeeSelect({ value, onChange }) {
  const api = useApi();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await api.get("/employees");
        const list = res.data?.data || [];
        setEmployees(list);
        if (!value && list.length > 0) {
          onChange(list[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [api]);

  const hasValue = value && employees.some((e) => e.name === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
    >
      {loading && <option value="">Loading employees…</option>}
      {value && !hasValue && <option value={value}>{value}</option>}
      {employees.map((e) => (
        <option key={e._id || e.name} value={e.name}>
          {e.name} ({e.role || e.department || "Advisor"})
        </option>
      ))}
    </select>
  );
}

function CompanySearchSelect({ value, onChange }) {
  const api = useApi();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await api.get("/companies");
        setCompanies(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch companies for deal select", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [api]);

  const filtered = useMemo(() => {
    if (!value) return companies;
    const q = value.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, value]);

  return (
    <div className="relative">
      <input
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type or select company name…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl animate-fade-in">
            {loading ? (
              <div className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin text-indigo-500" /> Loading companies…
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c._id || c.name}
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-left hover:bg-muted font-medium cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-indigo-500" />
                    <span className="font-semibold text-foreground">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.industry || "Company"}</span>
                </button>
              ))
            ) : (
              <div className="p-2.5 text-center text-xs text-muted-foreground">
                No company matching "<span className="font-semibold text-foreground">{value}</span>".
                <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">New company name will be saved with this deal.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AddDealModal({ defaultStage, onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    value: 500000,
    stage: defaultStage || "New",
    priority: "Medium",
    assignedTo: "Nikhil Rao",
    notes: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/deals", formData);
      toast.success("Deal created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create deal error", err);
      toast.error(err.response?.data?.message || "Failed to create deal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold">Add New Deal</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Deal Title *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. DGFT Annual Advisory" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Company *</label>
            <CompanySearchSelect
              value={formData.company}
              onChange={(val) => setFormData({ ...formData, company: val })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Deal Value (₹) *</label>
              <input type="number" required value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Stage</label>
              <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none">
                {stages.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Deal Owner / Assigned To</label>
            <EmployeeSelect
              value={formData.assignedTo}
              onChange={(val) => setFormData({ ...formData, assignedTo: val })}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />} Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
