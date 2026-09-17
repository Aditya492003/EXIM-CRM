import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Calendar, DollarSign, Filter, Handshake, LayoutGrid, List, Plus, Search, X,
  MoreHorizontal, GripVertical, FileText, Clock, StickyNote, Video, Pencil, Trash2, CheckCircle2, ChevronRight, Loader2, Building2,
  Briefcase, IndianRupee, Mail, PhoneCall, ExternalLink, Sparkles, User, Tag, ArrowRight, ChevronDown, Send, ShieldCheck, Lock
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { DealHandoverModal } from "@/components/crm/DealHandoverModal";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const stages = ["New", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const priorities = ["Low", "Medium", "High"];
const quickFilters = ["All Deals", "High Priority", "My Deals", "Proposal Sent", "Negotiation", "Won Deals", "Handed Over"];

const stageColors = {
  New: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  Qualified: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  "Proposal Sent": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  Negotiation: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Won: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Lost: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

function DealsPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || "Team Member";

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [dragMongoId, setDragMongoId] = useState(null);
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [handoverDeal, setHandoverDeal] = useState(null);
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("All Deals");

  // Advanced Filter state
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");

  // Add Deal Modal state
  const [openAdd, setOpenAdd] = useState(false);
  const [addDefaultStage, setAddDefaultStage] = useState("New");

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/deals");
      const data = res.data?.data || [];

      // Local storage fallback for handed over deals if needed
      let localHanded = [];
      try {
        localHanded = JSON.parse(localStorage.getItem("exim_handed_over_deals") || "[]");
      } catch (e) {}

      setDeals(data.map(d => {
        const isHanded = d.isHandedOver || localHanded.includes(d._id) || d.handoverStatus === "Handed Over";
        return {
          id: d.code || d._id,
          _id: d._id,
          name: d.name,
          company: d.company || "",
          companyId: d.companyId,
          leadId: d.leadId,
          contactId: d.contactId,
          value: d.value || 0,
          stage: d.stage || "New",
          priority: d.priority || "Medium",
          owner: d.assignedTo || "Team Member",
          assignedTo: d.assignedTo || "Team Member",
          assignedToClerkId: d.assignedToClerkId,
          expectedClose: d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString("en-IN") : "",
          expectedCloseDate: d.expectedCloseDate,
          closedDate: d.closedDate,
          createdDate: d.createdDate ? new Date(d.createdDate).toLocaleDateString("en-IN") : "Recently",
          service: d.service || "DGFT Advisory",
          serviceId: d.serviceId,
          notes: d.notes || "",
          isHandedOver: isHanded,
          handoverStatus: isHanded ? "Handed Over" : (d.handoverStatus || ""),
          handoverData: d.handoverData || null,
          handedOverAt: d.handedOverAt,
          handedOverBy: d.handedOverBy,
          timeline: d.timeline || [],
          collaborators: d.collaborators || [],
        };
      }));
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

  // Extract unique services from loaded deals for the filter
  const uniqueServices = useMemo(() => {
    const set = new Set(deals.map(d => d.service).filter(Boolean));
    return Array.from(set);
  }, [deals]);

  const filtered = useMemo(() => {
    let out = deals;

    if (stageFilter !== "All") out = out.filter((d) => d.stage === stageFilter);
    if (priorityFilter !== "All") out = out.filter((d) => d.priority === priorityFilter);
    if (ownerFilter !== "All") out = out.filter((d) => d.owner === ownerFilter);
    if (serviceFilter !== "All") out = out.filter((d) => d.service === serviceFilter);

    if (quick === "High Priority") out = out.filter((d) => d.priority === "High");
    if (quick === "My Deals") out = out.filter((d) => d.owner === currentUserName || d.assignedTo === currentUserName);
    if (quick === "Proposal Sent") out = out.filter((d) => d.stage === "Proposal Sent");
    if (quick === "Negotiation") out = out.filter((d) => d.stage === "Negotiation");
    if (quick === "Won Deals") out = out.filter((d) => d.stage === "Won");
    if (quick === "Handed Over") out = out.filter((d) => d.isHandedOver);

    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (d) =>
          d.name?.toLowerCase().includes(s) ||
          d.company?.toLowerCase().includes(s) ||
          d.service?.toLowerCase().includes(s) ||
          d.owner?.toLowerCase().includes(s),
      );
    }
    return out;
  }, [deals, stageFilter, priorityFilter, ownerFilter, serviceFilter, quick, search, currentUserName]);

  const byStage = (st) => filtered.filter((d) => d.stage === st);
  const totalValue = filtered.reduce((s, d) => s + d.value, 0);

  // Drag and drop / inline stage change saved immediately in DB
  const handleStageChange = async (targetId, mongoId, newStage) => {
    const targetDeal = deals.find(d => (d.id === targetId || d._id === mongoId));
    if (targetDeal?.isHandedOver) {
      toast.error("This deal has been handed over to the Execution Team. Stage changes are locked.");
      return;
    }

    setDeals((prev) => prev.map((d) => (d.id === targetId ? { ...d, stage: newStage } : d)));
    if (mongoId) {
      try {
        await api.patch(`/deals/${mongoId}/stage`, { stage: newStage });
        toast.success(`Deal moved to ${newStage}`);
        fetchDeals();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update deal stage");
        fetchDeals();
      }
    }
  };

  const onDrop = (newStage) => {
    if (!dragId) return;
    const targetDeal = deals.find(d => (d.id === dragId || d._id === dragMongoId));
    if (targetDeal?.isHandedOver) {
      toast.error("This deal has been handed over to Execution Team. Status cannot be modified.");
      setDragId(null);
      setDragMongoId(null);
      return;
    }
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
      toast.success("Deal deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete deal");
    }
  };

  const activeFiltersCount =
    (stageFilter !== "All" ? 1 : 0) +
    (priorityFilter !== "All" ? 1 : 0) +
    (ownerFilter !== "All" ? 1 : 0) +
    (serviceFilter !== "All" ? 1 : 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deal Pipeline</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Deals & Opportunities</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} active deals · Pipeline Value: <span className="font-semibold text-foreground">₹{(totalValue / 100000).toFixed(1)}L</span> (₹{totalValue.toLocaleString("en-IN")})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-card p-1 shadow-xs">
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer",
                  view === "kanban" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid size={13} /> Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer",
                  view === "list" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List size={13} /> List
              </button>
            </div>
            <button
              onClick={() => { setAddDefaultStage("New"); setOpenAdd(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
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
                quick === q ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Search & Multi-Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals, company, service, owner…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer text-foreground"
              title="Filter by Trade Service"
            >
              <option value="All">All Services</option>
              {uniqueServices.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer text-foreground"
            >
              <option value="All">All Stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer text-foreground"
            >
              <option value="All">All Priorities</option>
              {priorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setStageFilter("All");
                  setPriorityFilter("All");
                  setOwnerFilter("All");
                  setServiceFilter("All");
                  setSearch("");
                  setQuick("All Deals");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition"
              >
                <X size={12} /> Clear ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
            <div className="mt-2 text-sm">Loading deal pipeline...</div>
          </div>
        ) : view === "kanban" ? (
          <div className="flex gap-3 overflow-x-auto pb-4 items-start min-h-[500px]">
            {stages.map((st) => {
              const list = byStage(st);
              const val = list.reduce((a, b) => a + b.value, 0);
              return (
                <div
                  key={st}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(st)}
                  className="flex flex-col rounded-2xl border border-border bg-card p-3 shrink-0 w-[230px] shadow-xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="text-xs font-bold truncate">{st}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold shrink-0 ml-1">
                      {list.length}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
                    ₹{(val / 100000).toFixed(1)}L
                  </div>

                  {/* Cards */}
                  <div className="mt-2.5 flex flex-col gap-2.5 min-h-[120px]">
                    {list.map((d) => (
                      <div
                        key={d._id || d.id}
                        draggable={!d.isHandedOver}
                        onDragStart={() => {
                          if (d.isHandedOver) return;
                          setDragId(d.id);
                          setDragMongoId(d._id);
                        }}
                        onClick={() => setActive(d)}
                        className={cn(
                          "rounded-xl border bg-background p-3 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer group relative",
                          d.isHandedOver ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20" : "border-border"
                        )}
                      >
                        {/* Handed Over Indicator Badge */}
                        {d.isHandedOver && (
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                              <ShieldCheck size={11} /> Handed Over
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-0.5">
                              <Lock size={10} /> Locked
                            </span>
                          </div>
                        )}

                        <div className="font-bold text-xs text-foreground line-clamp-1 leading-snug group-hover:text-indigo-600 transition">
                          {d.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-medium flex items-center gap-1">
                          <Building2 size={11} className="text-muted-foreground/70 shrink-0" />
                          <span>{d.company || "Direct Opportunity"}</span>
                        </div>

                        {/* Prominent Service Badge */}
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 max-w-full truncate border border-indigo-100 dark:border-indigo-900/50">
                            <Briefcase size={10} className="shrink-0 text-indigo-500" />
                            <span className="truncate">{d.service || "DGFT Advisory"}</span>
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/60">
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{(d.value / 100000).toFixed(1)}L
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px] text-right">
                            {d.owner?.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <div className="grid h-24 place-items-center rounded-xl border border-dashed border-border text-[11px] text-muted-foreground font-medium">
                        Drop deals here
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
                  <th className="px-4 py-3.5">Deal Name</th>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Service / Job</th>
                  <th className="px-4 py-3.5">Value (₹)</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Owner</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => (
                  <tr key={d._id || d.id} className={cn("hover:bg-muted/40 transition", d.isHandedOver && "bg-emerald-50/10")}>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActive(d)}
                          className="hover:text-indigo-600 text-left cursor-pointer font-bold"
                        >
                          {d.name}
                        </button>
                        {d.isHandedOver && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <ShieldCheck size={10} /> Handed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">{d.company || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                        <Briefcase size={11} className="text-indigo-500" />
                        {d.service || "DGFT Advisory"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{d.value ? Number(d.value).toLocaleString("en-IN") : "0"}
                    </td>
                    <td className="px-4 py-3">
                      {d.isHandedOver ? (
                        <div
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 cursor-not-allowed"
                          title="Handed over to Execution Team - Status changes are locked"
                        >
                          <Lock size={12} className="text-emerald-600" /> Handed Over
                        </div>
                      ) : (
                        <select
                          value={d.stage}
                          onChange={(e) => handleStageChange(d.id, d._id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                        >
                          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <span className={cn(
                        "inline-block rounded-md px-2 py-0.5 text-[11px] font-bold",
                        d.priority === "High" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" :
                        d.priority === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-medium">{d.owner}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Handover Button */}
                        {!d.isHandedOver ? (
                          <button
                            onClick={() => setHandoverDeal(d)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 px-2 py-1 text-xs font-bold transition cursor-pointer"
                            title="Handover Deal to Execution Team"
                          >
                            <Send size={12} /> Handover
                          </button>
                        ) : (
                          <button
                            onClick={() => setHandoverDeal(d)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 px-2 py-1 text-xs font-bold transition cursor-pointer"
                            title="View Handover Details"
                          >
                            <ShieldCheck size={12} /> Handed
                          </button>
                        )}

                        <button
                          onClick={() => setActive(d)}
                          className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="View Deal"
                        >
                          <FileText size={15} />
                        </button>
                        {!d.isHandedOver && (
                          <button
                            onClick={() => setEditing(d)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            title="Edit Deal"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDeal(d)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          title="Delete Deal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Deal Detail Drawer (Just like in Leads) */}
      {active && (
        <DealDetailDrawer
          deal={active}
          onClose={() => setActive(null)}
          onEdit={() => {
            const target = active;
            setActive(null);
            setEditing(target);
          }}
          onHandover={() => {
            const target = active;
            setActive(null);
            setHandoverDeal(target);
          }}
          onDelete={() => handleDeleteDeal(active)}
          onRefresh={fetchDeals}
        />
      )}

      {/* Deal Handover Modal */}
      {handoverDeal && (
        <DealHandoverModal
          deal={handoverDeal}
          onClose={() => setHandoverDeal(null)}
          onSuccess={() => {
            setHandoverDeal(null);
            fetchDeals();
          }}
        />
      )}

      {/* Edit Deal Modal */}
      {editing && (
        <EditDealModal
          deal={editing}
          onClose={() => setEditing(null)}
          onSuccess={fetchDeals}
        />
      )}

      {/* Add Deal Modal */}
      {openAdd && (
        <AddDealModal
          defaultStage={addDefaultStage}
          onClose={() => setOpenAdd(false)}
          onSuccess={fetchDeals}
        />
      )}
    </AppLayout>
  );
}

/* ── Searchable Service Select Component ───────────────── */
export function ServiceSelect({ value, onChange, required = true }) {
  const api = useApi();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/services");
        const list = res.data?.data || [];
        setServices(list);
        if (!value && list.length > 0) {
          onChange(list[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch services in ServiceSelect", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [api]);

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    );
  }, [services, search]);

  const displayVal = value || "";

  return (
    <div className="relative">
      <div className="relative">
        <input
          required={required}
          value={open ? search : displayVal}
          onFocus={() => {
            setSearch("");
            setOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Select or type trade service…"
          className="w-full rounded-xl border border-border bg-background pl-3 pr-8 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950"
        />
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl animate-fade-in">
            {loading ? (
              <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin text-indigo-500" /> Loading services…
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((s) => {
                const isSelected = value === s.name;
                return (
                  <button
                    key={s._id || s.name}
                    type="button"
                    onClick={() => {
                      onChange(s.name);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-left cursor-pointer transition",
                      isSelected ? "bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-500/20 dark:text-indigo-300" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      {s.description && <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{s.description}</div>}
                    </div>
                    {isSelected && <CheckCircle2 size={13} className="text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No matching service found. Custom name will be saved.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Full Interactive Deal Detail Drawer (View Deal) ──── */
export function DealDetailDrawer({ deal, onClose, onEdit, onHandover, onDelete, onRefresh }) {
  const navigate = useNavigate();
  const api = useApi();
  const [tab, setTab] = useState("overview");
  const [notes, setNotes] = useState(deal.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await api.patch(`/deals/${deal._id}/notes`, { notes });
      toast.success("Deal notes saved successfully");
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateProposal = () => {
    navigate({
      to: "/proposals/new",
      search: {
        clientName: deal.company || deal.name,
        serviceName: deal.service || "DGFT Advisory",
        proposalValue: String(deal.value || 500000),
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl bg-background p-6 shadow-2xl overflow-y-auto animate-slide-left flex flex-col justify-between">
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold shadow-md shadow-indigo-500/20">
                <Briefcase size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{deal.name}</h2>
                  {deal.isHandedOver && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <ShieldCheck size={11} /> Handed Over
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-indigo-600">{deal.company || "Direct Opportunity"}</span>
                  <span className="text-xs text-muted-foreground">· ₹{deal.value ? Number(deal.value).toLocaleString("en-IN") : "0"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!deal.isHandedOver && (
                <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer" title="Edit Deal">
                  <Pencil size={16} />
                </button>
              )}
              <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer" title="Delete Deal">
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={18} /></button>
            </div>
          </div>

          {/* Handover Locked Banner */}
          {deal.isHandedOver ? (
            <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                    Deal Handed Over to Execution Team
                  </div>
                  <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 mt-0.5">
                    Stage modification is locked. Project is under active operations execution.
                  </p>
                </div>
              </div>
              <button
                onClick={onHandover}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition cursor-pointer shrink-0"
              >
                View Handover
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Pass Deal to Execution Team</span>
                  <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80">Complete the 7-part formal handover form</p>
                </div>
              </div>
              <button
                onClick={onHandover}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer shrink-0"
              >
                <Send size={12} /> Handover Now
              </button>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleCreateProposal}
              className="flex flex-col items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/70 p-2.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300 transition cursor-pointer"
            >
              <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Proposal</span>
            </button>
            <button
              onClick={() => {
                navigate({ to: "/meetings" });
              }}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
            >
              <Calendar size={16} className="text-indigo-500" />
              <span>Meetings</span>
            </button>
            <button
              onClick={onHandover}
              className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 transition cursor-pointer"
            >
              <Send size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Handover</span>
            </button>
            <button
              onClick={() => {
                if (deal.company) {
                  navigate({ to: "/companies" });
                }
              }}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
            >
              <Building2 size={16} className="text-indigo-500" />
              <span>Company</span>
            </button>
          </div>

          {/* Tabs Header */}
          <div className="flex border-b border-border text-xs font-medium text-muted-foreground overflow-x-auto">
            {["overview", "collaborators", "timeline", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-2 capitalize transition border-b-2 cursor-pointer shrink-0",
                  tab === t ? "border-indigo-600 font-bold text-indigo-600" : "border-transparent hover:text-foreground"
                )}
              >
                {t === "collaborators" ? `Collaborators (${deal.collaborators?.length || 0})` : t}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {tab === "overview" && (
            <div className="space-y-4 text-xs">
              {/* Highlight Service & Value Banner */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-violet-50/90 p-4 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-violet-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-indigo-600 dark:text-indigo-400" />
                    Target Trade Service
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                    {deal.service || "DGFT Advisory"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 dark:border-indigo-900/40">
                  <span className="text-[11px] font-semibold text-muted-foreground">Deal Commercial Value</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{deal.value ? Number(deal.value).toLocaleString("en-IN") : "0"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-muted/30">
                <InfoItem label="Stage" value={deal.isHandedOver ? "Handed Over (Locked)" : (deal.stage || "New")} highlight />
                <InfoItem label="Priority" value={deal.priority || "Medium"} />
                <InfoItem label="Client / Company" value={deal.company || "Not assigned"} />
                <InfoItem label="Assigned Advisor" value={deal.owner || deal.assignedTo || "You"} />
                <InfoItem label="Expected Close Date" value={deal.expectedClose || "Not specified"} />
                <InfoItem label="Closed Date" value={deal.closedDate ? new Date(deal.closedDate).toLocaleDateString("en-IN") : "In Progress"} />
                <InfoItem label="Created Date" value={deal.createdDate || "Recently"} />
                <InfoItem label="Service Name" value={deal.service || "DGFT Advisory"} highlight />
              </div>
            </div>
          )}

          {/* Tab 2: Collaborators */}
          {tab === "collaborators" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Active Deal Collaborators ({deal.collaborators?.length || 0})</span>
                </div>
                {deal.collaborators && deal.collaborators.length > 0 ? (
                  <div className="space-y-2">
                    {deal.collaborators.map((c) => (
                      <div key={c.clerkId || c.email} className="flex items-center justify-between rounded-xl bg-background p-2.5 border border-border">
                        <div>
                          <div className="font-bold text-foreground">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.role} · Workspace: {c.managerName || "Manager"}</div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(`Remove collaborator ${c.name}?`)) return;
                            try {
                              await api.delete("/collaboration-requests/remove-collaborator", {
                                data: { entityType: "Deal", entityId: deal._id, collaboratorClerkId: c.clerkId }
                              });
                              toast.success(`Removed ${c.name} from deal collaborators`);
                              onRefresh?.();
                              onClose();
                            } catch (err) {
                              toast.error(err.response?.data?.message || "Failed to remove collaborator");
                            }
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          title="Remove Collaborator"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic">No secondary collaborators on this deal yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Timeline */}
          {tab === "timeline" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                <div className="font-bold text-foreground">Deal Activity Timeline</div>
                {deal.timeline && deal.timeline.length > 0 ? (
                  <div className="space-y-3 relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-900">
                    {deal.timeline.map((t, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 border-2 border-background" />
                        <div className="font-semibold text-foreground">{t.activity}</div>
                        <div className="text-[10px] text-muted-foreground">{t.performedBy} · {new Date(t.timestamp).toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic">No timeline events recorded yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Notes */}
          {tab === "notes" && (
            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <label className="block text-xs font-semibold flex items-center gap-1.5">
                  <StickyNote size={14} className="text-indigo-500" /> Strategic Notes & Next Steps
                </label>
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record commercial discussions, DGFT compliance scope, client commitments..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    {savingNotes && <Loader2 size={13} className="animate-spin" />} Save Notes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight, danger }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-xs font-medium", highlight && "text-indigo-600 font-bold dark:text-indigo-400", danger && "text-rose-600 font-bold")}>
        {value}
      </div>
    </div>
  );
}

/* ── Add Deal Modal ───────────────────────────────────── */
export function AddDealModal({ defaultStage = "New", defaultCompany = "", onClose, onSuccess }) {
  const api = useApi();
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || "";

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: defaultCompany ? `${defaultCompany} - New Deal` : "",
    company: defaultCompany || "",
    service: "DGFT Advisory",
    value: 500000,
    stage: defaultStage || "New",
    priority: "Medium",
    assignedTo: currentUserName,
    expectedCloseDate: "",
    notes: "",
  });

  const [duplicateData, setDuplicateData] = useState(null);
  const [requestingCollab, setRequestingCollab] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setDuplicateData(null);
      await api.post("/deals", formData);
      toast.success("Deal created successfully! 🎉");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create deal error", err);
      if (err.response?.data?.isDealDuplicate && err.response?.data?.existingDeal) {
        setDuplicateData(err.response.data.existingDeal);
      } else {
        toast.error(err.response?.data?.message || "Failed to create deal");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCollaboration = async () => {
    if (!duplicateData?._id) return;
    try {
      setRequestingCollab(true);
      const res = await api.post("/collaboration-requests", {
        entityType: "Deal",
        entityId: duplicateData._id,
        reason: "Requesting collaboration on active business deal opportunity.",
      });
      toast.success(res.data?.message || `Collaboration request sent to ${duplicateData.ownerName}`);
      setDuplicateData(null);
      onClose();
    } catch (err) {
      console.error("Deal collaboration request error:", err);
      toast.error(err.response?.data?.message || "Failed to send collaboration request");
    } finally {
      setRequestingCollab(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold">Add New Deal</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        {duplicateData ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 dark:border-amber-900/50 dark:bg-amber-950/40 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                <Handshake size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                  Active Deal Already Exists in Database!
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  An active deal for <strong>{duplicateData.company}</strong> ({duplicateData.service || duplicateData.name}) already exists.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3.5 text-xs space-y-1.5 border border-amber-200 shadow-sm">
              <div><strong>Company Name:</strong> {duplicateData.company}</div>
              <div><strong>Deal Title:</strong> {duplicateData.name}</div>
              <div><strong>Service:</strong> <span className="font-semibold text-indigo-600">{duplicateData.service || "DGFT"}</span></div>
              <div><strong>Deal Value:</strong> ₹{duplicateData.value?.toLocaleString("en-IN")}</div>
              <div><strong>Current Stage:</strong> <span className="font-semibold text-indigo-600">{duplicateData.stage}</span></div>
              <div className="pt-2 text-indigo-700 font-bold border-t border-amber-200/60 dark:text-indigo-300 flex items-center justify-between">
                <span>Current Owner:</span>
                <span>{duplicateData.ownerName} (Workspace: {duplicateData.managerName})</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setDuplicateData(null)}
                className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestCollaboration}
                disabled={requestingCollab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {requestingCollab ? <Loader2 size={14} className="animate-spin" /> : <Handshake size={14} />} Request Collaboration
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-semibold">Deal Title *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Corp - DGFT Annual Advisory"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Company *</label>
              <CompanySearchSelect
                value={formData.company}
                onChange={(val) => setFormData({ ...formData, company: val })}
              />
            </div>

            {/* Service Selection */}
            <div>
              <label className="mb-1 block text-xs font-semibold flex items-center gap-1.5">
                <Briefcase size={13} className="text-indigo-500" /> Trade Service / Job *
              </label>
              <ServiceSelect
                value={formData.service}
                onChange={(val) => {
                  setFormData(prev => ({
                    ...prev,
                    service: val,
                    name: prev.name || (prev.company ? `${prev.company} - ${val}` : "")
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Deal Value (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Expected Close Date</label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Deal Owner / Assigned Advisor</label>
              <EmployeeSelect
                value={formData.assignedTo}
                onChange={(val) => setFormData({ ...formData, assignedTo: val })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Notes & Context</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Scope details, pricing terms, initial client meeting notes..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />} Create Deal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Edit Deal Modal ──────────────────────────────────── */
export function EditDealModal({ deal, onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: deal.name || "",
    company: deal.company || "",
    service: deal.service || "DGFT Advisory",
    value: deal.value || 0,
    stage: deal.stage || "New",
    priority: deal.priority || "Medium",
    assignedTo: deal.owner || deal.assignedTo || "",
    expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : "",
    notes: deal.notes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/deals/${deal._id}`, formData);
      toast.success("Deal updated successfully! 🎉");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update deal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Pencil size={16} className="text-indigo-600" />
            <h2 className="text-lg font-bold">Edit Deal</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Deal Title *</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Company</label>
            <input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          {/* Service Selection */}
          <div>
            <label className="mb-1 block text-xs font-semibold flex items-center gap-1.5">
              <Briefcase size={13} className="text-indigo-500" /> Trade Service / Job *
            </label>
            <ServiceSelect
              value={formData.service}
              onChange={(val) => setFormData({ ...formData, service: val })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Deal Value (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
              >
                {stages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
              >
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Expected Close Date</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Deal Owner / Assigned Advisor</label>
            <EmployeeSelect
              value={formData.assignedTo}
              onChange={(val) => setFormData({ ...formData, assignedTo: val })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Notes & Context</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
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
