import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar, DollarSign, Filter, Handshake, LayoutGrid, List, Plus, Search, X,
  MoreHorizontal, GripVertical, FileText, Clock, StickyNote, Video, Pencil, Trash2, CheckCircle2, ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { deals as allDeals, stageColors } from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const stages = ["New", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const priorities = ["Low", "Medium", "High"];
const owners = ["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai", "Varun Iyer", "Zara Khan"];
const quickFilters = ["All Deals", "High Priority", "My Deals", "Proposal Sent", "Negotiation", "Won Deals"];

function DealsPage() {
  const [deals, setDeals] = useState(allDeals);
  const [dragId, setDragId] = useState(null);
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

  const filtered = useMemo(() => {
    let out = deals;

    if (stageFilter !== "All") {
      out = out.filter((d) => d.stage === stageFilter);
    }
    if (priorityFilter !== "All") {
      out = out.filter((d) => d.priority === priorityFilter);
    }
    if (ownerFilter !== "All") {
      out = out.filter((d) => d.owner === ownerFilter);
    }

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

  const onDrop = (stage) => {
    if (!dragId) return;
    setDeals((prev) => prev.map((d) => (d.id === dragId ? { ...d, stage } : d)));
    setDragId(null);
  };

  const handleAddDeal = (newDeal) => {
    setDeals((prev) => [newDeal, ...prev]);
    setOpenAdd(false);
  };

  const handleUpdateDeal = (updated) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditing(null);
    if (active && active.id === updated.id) {
      setActive(updated);
    }
  };

  const handleDeleteDeal = (id) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setActive(null);
    setEditing(null);
  };

  const resetFilters = () => {
    setStageFilter("All");
    setPriorityFilter("All");
    setOwnerFilter("All");
    setSearch("");
    setQuick("All Deals");
  };

  const hasActiveFilters = stageFilter !== "All" || priorityFilter !== "All" || ownerFilter !== "All" || search !== "" || quick !== "All Deals";

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pipeline</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Deals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} deals · ₹{(totalValue / 100000).toFixed(2)}L total pipeline value
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                  view === "kanban" ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid size={13} /> Board
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                  view === "list" ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List size={13} /> List
              </button>
            </div>
            <button
              onClick={() => setOpenFilter(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition",
                hasActiveFilters ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-border bg-card hover:bg-muted"
              )}
            >
              <Filter size={14} /> Filter {hasActiveFilters && "•"}
            </button>
            <button
              onClick={() => {
                setAddDefaultStage("New");
                setOpenAdd(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition"
            >
              <Plus size={14} /> Add Deal
            </button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {quickFilters.map((q) => (
            <button
              key={q}
              onClick={() => setQuick(q)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                quick === q
                  ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                  : "border-border bg-card hover:border-indigo-300 hover:text-indigo-600",
              )}
            >
              {q}
            </button>
          ))}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-indigo-600 hover:underline px-2">
              Reset Filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals, companies, owners…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div>
          {stageFilter !== "All" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              Stage: {stageFilter} <X size={12} className="cursor-pointer" onClick={() => setStageFilter("All")} />
            </span>
          )}
        </div>

        {view === "kanban" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            {stages.map((s) => {
              const list = byStage(s);
              const stageTotal = list.reduce((sum, d) => sum + d.value, 0);
              return (
                <div
                  key={s}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(s)}
                  className={cn("flex min-h-[350px] flex-col rounded-2xl border-2 border-dashed p-3 transition", stageColors[s], dragId && "border-indigo-400")}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s}</span>
                      <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm dark:bg-slate-900/60">{list.length}</span>
                    </div>
                    <button
                      onClick={() => {
                        setAddDefaultStage(s);
                        setOpenAdd(true);
                      }}
                      title={`Add deal to ${s}`}
                      className="rounded-md p-1 hover:bg-white/50 dark:hover:bg-white/10 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">₹{(stageTotal / 100000).toFixed(1)}L pipeline</div>
                  <div className="space-y-2 flex-1">
                    {list.map((d) => (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={() => setDragId(d.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setActive(d)}
                        className={cn(
                          "group cursor-grab rounded-xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
                          dragId === d.id && "opacity-40",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="mt-0.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{d.name}</div>
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{d.company}</div>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                              d.priority === "High" && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
                              d.priority === "Medium" && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                              d.priority === "Low" && "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
                            )}
                          >
                            {d.priority}
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="text-sm font-bold text-emerald-600">₹{d.value.toLocaleString("en-IN")}</div>
                          <UserAvatar name={d.owner} size="xs" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar size={10} /> {d.expectedClose}
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 text-indigo-600 font-medium transition">View →</span>
                        </div>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <div className="grid h-24 place-items-center rounded-xl border border-dashed border-border/60 text-center p-2">
                        <span className="text-xs text-muted-foreground/60">No deals in {s}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {["Deal Name", "Company", "Value", "Owner", "Expected Close", "Priority", "Stage", "Actions"].map((c) => (
                    <th key={c} className="whitespace-nowrap px-4 py-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => (
                  <tr key={d.id} onClick={() => setActive(d)} className="cursor-pointer transition hover:bg-muted/40 group">
                    <td className="px-4 py-3 font-semibold text-foreground">{d.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{d.company}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-emerald-600">₹{d.value.toLocaleString("en-IN")}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={d.owner} size="xs" />
                        <span className="text-xs">{d.owner}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">{d.expectedClose}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          d.priority === "High" && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
                          d.priority === "Medium" && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                          d.priority === "Low" && "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
                        )}
                      >
                        {d.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {d.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setEditing(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteDeal(d.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      No deals match the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      {openFilter && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpenFilter(false)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl animate-slide-in-right">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold">Filter Deals</h2>
                <p className="text-xs text-muted-foreground">Refine deals by stage, priority, and owner.</p>
              </div>
              <button onClick={() => setOpenFilter(false)} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold">Deal Stage</label>
                <div className="flex flex-wrap gap-1.5">
                  {["All", ...stages].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStageFilter(st)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        stageFilter === st ? "border-indigo-500 bg-indigo-500 text-white" : "border-border bg-background hover:border-indigo-400"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">Priority</label>
                <div className="flex flex-wrap gap-1.5">
                  {["All", ...priorities].map((pr) => (
                    <button
                      key={pr}
                      onClick={() => setPriorityFilter(pr)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        priorityFilter === pr ? "border-indigo-500 bg-indigo-500 text-white" : "border-border bg-background hover:border-indigo-400"
                      )}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">Deal Owner</label>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="All">All Owners</option>
                  {owners.map((o) => <option key={o} value={o}>{o}</option>)}
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

      {/* Add Deal Modal */}
      {openAdd && (
        <DealModal defaultStage={addDefaultStage} onClose={() => setOpenAdd(false)} onSave={handleAddDeal} />
      )}

      {/* Edit Deal Modal */}
      {editing && (
        <DealModal deal={editing} onClose={() => setEditing(null)} onSave={handleUpdateDeal} />
      )}

      {/* Deal Detail Drawer */}
      {active && (
        <DealDetail
          deal={active}
          onClose={() => setActive(null)}
          onEdit={(d) => {
            setActive(null);
            setEditing(d);
          }}
          onStageChange={(newStage) => {
            const updated = { ...active, stage: newStage };
            handleUpdateDeal(updated);
          }}
          onDelete={() => handleDeleteDeal(active.id)}
        />
      )}
    </AppLayout>
  );
}

function DealModal({ deal, defaultStage = "New", onClose, onSave }) {
  const [name, setName] = useState(deal?.name ?? "");
  const [company, setCompany] = useState(deal?.company ?? "");
  const [value, setValue] = useState(deal?.value ?? 150000);
  const [stage, setStage] = useState(deal?.stage ?? defaultStage);
  const [priority, setPriority] = useState(deal?.priority ?? "Medium");
  const [owner, setOwner] = useState(deal?.owner ?? "Nikhil Rao");
  const [expectedClose, setExpectedClose] = useState(deal?.expectedClose ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: deal?.id ?? `D-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      company,
      value: Number(value),
      stage,
      priority,
      owner,
      expectedClose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">{deal ? "Edit Deal" : "Create New Deal"}</h2>
            <p className="text-xs text-muted-foreground">Add pipeline opportunity details.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Deal Title *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 Textile Export Order" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Company *</label>
              <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Meridian Trade Co." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Deal Value (₹) *</label>
              <input type="number" required value={value} onChange={(e) => setValue(e.target.value)} placeholder="150000" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {stages.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {priorities.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Owner</label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {owners.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Expected Close Date</label>
              <input type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">
              {deal ? "Save Changes" : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealDetail({ deal, onClose, onEdit, onStageChange, onDelete }) {
  const [tab, setTab] = useState("overview");
  const tabs = ["overview", "activities", "files", "notes", "meetings", "tasks"];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto bg-background shadow-2xl animate-slide-in-right">
        <div className="border-b border-border bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
              <Handshake size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold">{deal.name}</h2>
              <div className="mt-1 text-sm text-muted-foreground">{deal.company}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="text-2xl font-bold text-emerald-600">₹{deal.value.toLocaleString("en-IN")}</div>
                <select
                  value={deal.stage}
                  onChange={(e) => onStageChange(e.target.value)}
                  className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 outline-none cursor-pointer dark:bg-indigo-500/20 dark:text-indigo-300"
                >
                  {stages.map((s) => <option key={s}>{s}</option>)}
                </select>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    deal.priority === "High" && "bg-rose-100 text-rose-700",
                    deal.priority === "Medium" && "bg-amber-100 text-amber-700",
                    deal.priority === "Low" && "bg-slate-100 text-slate-700",
                  )}
                >
                  {deal.priority} Priority
                </span>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "border-b-2 px-3 py-2 text-xs font-medium capitalize transition -mb-3",
                    tab === t ? "border-indigo-500 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(deal)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted">
                <Pencil size={12} /> Edit
              </button>
              <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-500/10">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 text-sm font-semibold">Deal Info</div>
                {[
                  ["Owner", deal.owner],
                  ["Company", deal.company],
                  ["Value", `₹${deal.value.toLocaleString("en-IN")}`],
                  ["Expected Close", deal.expectedClose],
                  ["Priority", deal.priority],
                  ["Current Stage", deal.stage],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between border-b border-border/60 py-2 text-xs last:border-0">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <DollarSign size={14} className="text-emerald-600" /> Pipeline Progress
                </div>
                <div className="space-y-2">
                  {stages.slice(0, 5).map((s, i) => {
                    const idx = stages.indexOf(deal.stage);
                    const done = i <= idx;
                    return (
                      <button
                        key={s}
                        onClick={() => onStageChange(s)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg p-1.5 transition text-left",
                          done ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-muted/40",
                        )}
                      >
                        <div className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold", done ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground")}>
                          {i + 1}
                        </div>
                        <div className={cn("text-xs flex-1", done ? "font-semibold text-foreground" : "text-muted-foreground")}>{s}</div>
                        {done && <span className="text-[10px] font-medium text-emerald-600">✓ Done</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "activities" && (
            <ol className="relative space-y-4 border-l-2 border-dashed border-border pl-5">
              {[
                { icon: FileText, title: "Proposal sent to client", time: "2 days ago" },
                { icon: Video, title: "Discovery call conducted", time: "1 week ago" },
                { icon: StickyNote, title: "Note added — client agreed on pricing terms", time: "1 week ago" },
              ].map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-0 grid h-4 w-4 place-items-center rounded-full bg-card ring-2 ring-indigo-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  </span>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock size={10} /> {a.time}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {["files", "notes", "meetings", "tasks"].includes(tab) && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
                <FileText size={18} className="text-muted-foreground" />
              </div>
              <div className="mt-3 text-sm font-semibold capitalize">No {tab} yet</div>
              <div className="mt-1 text-xs text-muted-foreground">Add the first {tab.slice(0, -1)} for this deal.</div>
              <button className="mt-4 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white">Add {tab.slice(0, -1)}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
