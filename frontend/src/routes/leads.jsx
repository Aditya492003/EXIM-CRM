import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Columns3, Download,
  Filter, MessageSquare, MoreHorizontal, Phone, Plus, RefreshCw, Search,
  Sparkles, Star, Trash2, Upload, X, Mail, FileText, Handshake, CheckCircle2,
  Clock, User as UserIcon, PhoneCall, StickyNote, Pencil, Globe,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { leads as allLeads, servicesList } from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});

const statuses = ["New", "Contacted", "Interested", "Proposal Sent", "Negotiation", "Converted", "Lost", "Inactive"];
const serviceNames = servicesList.map((s) => s.name);
const quickFilters = ["All Leads", "Today's Leads", "New Leads", "Unassigned", "Follow-up Today", "Overdue", "Favorites"];

const ALL_COLUMNS = [
  { key: "lead", label: "Lead" },
  { key: "company", label: "Company" },
  { key: "service", label: "Service / Job" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "source", label: "Source" },
  { key: "assigned", label: "Assigned" },
  { key: "status", label: "Status" },
  { key: "created", label: "Created" },
  { key: "lastContact", label: "Last Contact" },
  { key: "nextFollowUp", label: "Next Follow-up" },
];
const DEFAULT_COLUMNS = ["lead", "company", "service", "status"];

function LeadsPage() {
  const [leadsList, setLeadsList] = useState(allLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [quick, setQuick] = useState("All Leads");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [openFilter, setOpenFilter] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [favorites, setFavorites] = useState(new Set(["L-1002", "L-1007"]));
  const [visibleCols, setVisibleCols] = useState(new Set(DEFAULT_COLUMNS));
  const [openColumns, setOpenColumns] = useState(false);

  const handleStatusChange = (id, newStatus) => {
    setLeadsList((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
  };

  const toggleCol = (key) => {
    const next = new Set(visibleCols);
    next.has(key) ? next.delete(key) : next.add(key);
    setVisibleCols(next);
  };
  const isVisible = (key) => visibleCols.has(key);

  const filtered = useMemo(() => {
    let out = leadsList;
    if (statusFilter !== "All") out = out.filter((l) => l.status === statusFilter);
    if (quick === "New Leads") out = out.filter((l) => l.status === "New");
    if (quick === "Favorites") out = out.filter((l) => favorites.has(l.id));
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (l) => l.name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) ||
          l.company.toLowerCase().includes(s) || (l.service && l.service.toLowerCase().includes(s)) || l.phone.includes(s),
      );
    }
    return out;
  }, [statusFilter, quick, search, favorites]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleAll = () => {
    if (paginated.every((l) => selected.has(l.id))) {
      const next = new Set(selected);
      paginated.forEach((l) => next.delete(l.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      paginated.forEach((l) => next.add(l.id));
      setSelected(next);
    }
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleFav = (id) => {
    const next = new Set(favorites);
    next.has(id) ? next.delete(id) : next.add(id);
    setFavorites(next);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sales Workspace</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} of {allLeads.length} leads · {selected.size} selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton onClick={() => setOpenFilter(true)}><Filter size={14} /> Filters</IconButton>
            <IconButton><Upload size={14} /> Import</IconButton>
            <IconButton><Download size={14} /> Export</IconButton>
            <div className="relative">
              <IconButton onClick={() => setOpenColumns((v) => !v)}><Columns3 size={14} /> Columns</IconButton>
              {openColumns && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenColumns(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-card p-2 shadow-lg">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <div className="text-xs font-semibold">Visible columns</div>
                      <button
                        onClick={() => setVisibleCols(new Set(DEFAULT_COLUMNS))}
                        className="text-[11px] text-indigo-600 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {ALL_COLUMNS.map((c) => (
                        <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={isVisible(c.key)}
                            onChange={() => toggleCol(c.key)}
                            className="h-4 w-4 rounded border-border accent-indigo-500"
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <IconButton><RefreshCw size={14} /></IconButton>
            <button onClick={() => setOpenAdd(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-2 text-xs font-medium text-white shadow-md shadow-indigo-500/20 hover:shadow-lg">
              <Plus size={14} /> Add Lead
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quickFilters.map((q) => (
            <button
              key={q}
              onClick={() => setQuick(q)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                quick === q ? "border-indigo-500 bg-indigo-500 text-white shadow-sm" : "border-border bg-card hover:border-indigo-300 hover:text-indigo-600",
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, company, phone…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              <option value="All">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs dark:border-indigo-500/30 dark:bg-indigo-500/10">
                <span className="font-medium text-indigo-700 dark:text-indigo-300">{selected.size} selected</span>
                <button className="rounded-md px-2 py-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">Assign</button>
                <button className="rounded-md px-2 py-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">Status</button>
                <button className="rounded-md px-2 py-0.5 text-rose-600 hover:bg-rose-100">Delete</button>
                <button onClick={() => setSelected(new Set())} className="rounded-md p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"><X size={12} /></button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-md">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" onChange={toggleAll} checked={paginated.length > 0 && paginated.every((l) => selected.has(l.id))} className="h-4 w-4 rounded border-border accent-indigo-500" />
                  </th>
                  {ALL_COLUMNS.filter((c) => isVisible(c.key)).map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-4 py-3">
                      <button className="inline-flex items-center gap-1 hover:text-foreground">
                        {c.label} <ArrowUpDown size={10} className="opacity-40" />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setActive(l)}
                    className="group cursor-pointer border-t border-border transition hover:bg-muted/40"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleOne(l.id)} className="h-4 w-4 rounded border-border accent-indigo-500" />
                    </td>
                    {isVisible("lead") && <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <button onClick={(e) => { e.stopPropagation(); toggleFav(l.id); }} className="text-muted-foreground transition hover:text-amber-500">
                          <Star size={14} className={cn(favorites.has(l.id) && "fill-amber-400 text-amber-400")} />
                        </button>
                        <UserAvatar name={l.name} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{l.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{l.id}</div>
                        </div>
                      </div>
                    </td>}
                    {isVisible("company") && <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{l.company}</td>}
                    {isVisible("service") && <td className="whitespace-nowrap px-4 py-3"><span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{l.service || "General Advisory"}</span></td>}
                    {isVisible("phone") && <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{l.phone}</td>}
                    {isVisible("email") && <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{l.email}</td>}
                    {isVisible("source") && <td className="whitespace-nowrap px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">{l.source}</span></td>}
                    {isVisible("assigned") && <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2"><UserAvatar name={l.assignedTo} size="xs" /><span className="text-xs">{l.assignedTo.split(" ")[0]}</span></div>
                    </td>}
                    {isVisible("status") && (
                      <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={l.status}
                          onChange={(e) => handleStatusChange(l.id, e.target.value)}
                          className={cn(
                            "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold outline-none transition",
                            l.status === "New" && "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-300",
                            l.status === "Contacted" && "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
                            l.status === "Interested" && "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300",
                            l.status === "Proposal Sent" && "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-500/10 dark:text-violet-300",
                            l.status === "Negotiation" && "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-300",
                            l.status === "Converted" && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
                            l.status === "Lost" && "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300",
                            l.status === "Inactive" && "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
                          )}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {isVisible("created") && <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">{l.createdDate}</td>}
                    {isVisible("lastContact") && <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">{l.lastContacted}</td>}
                    {isVisible("nextFollowUp") && <td className="whitespace-nowrap px-4 py-3 text-[11px] font-medium">{l.nextFollowUp}</td>}
                    <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"><Phone size={14} /></button>
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-600"><Mail size={14} /></button>
                        <button onClick={() => setEditing(l)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={14} /></button>
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreHorizontal size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={visibleCols.size + 2} className="p-16 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted"><Sparkles size={22} className="text-muted-foreground" /></div>
                        <div className="mt-3 text-sm font-semibold">No leads found</div>
                        <div className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or add a new lead to get started.</div>
                        <button onClick={() => setOpenAdd(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600">
                          <Plus size={14} /> Add Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-muted"><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={cn("h-8 w-8 rounded-lg text-xs font-medium", page === i + 1 ? "bg-indigo-500 text-white" : "hover:bg-muted")}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-muted"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {openFilter && <FilterDrawer onClose={() => setOpenFilter(false)} />}
      {active && <LeadDetailDrawer lead={active} onClose={() => setActive(null)} onEdit={(l) => { setActive(null); setEditing(l); }} />}
      {openAdd && <AddLeadModal onClose={() => setOpenAdd(false)} />}
      {editing && <EditLeadModal lead={editing} onClose={() => setEditing(null)} />}
    </AppLayout>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm transition hover:bg-muted">
      {children}
    </button>
  );
}

function FilterDrawer({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl animate-slide-in-right">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Advanced Filters</h2>
            <p className="text-xs text-muted-foreground">Narrow down leads to focus your work.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="space-y-5">
          {[
            { label: "Lead Status", options: statuses },
            { label: "Lead Source", options: ["Website", "LinkedIn", "Referral", "Cold Call", "Trade Show"] },
            { label: "Assigned Salesperson", options: ["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai"] },
          ].map((g) => (
            <div key={g.label}>
              <div className="mb-2 text-xs font-semibold">{g.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map((o) => (
                  <button key={o} className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-indigo-400 hover:text-indigo-600">{o}</button>
                ))}
              </div>
            </div>
          ))}
          {[
            { label: "Date Created" },
            { label: "Last Contacted" },
            { label: "Next Follow-up" },
          ].map((g) => (
            <div key={g.label}>
              <div className="mb-2 text-xs font-semibold">{g.label}</div>
              <div className="flex gap-2">
                <div className="relative flex-1"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /><input type="date" className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs" /></div>
                <div className="relative flex-1"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /><input type="date" className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs" /></div>
              </div>
            </div>
          ))}
          <div>
            <div className="mb-2 text-xs font-semibold">Saved Filters</div>
            <div className="space-y-1.5">
              {["My hot leads", "Enterprise prospects", "Needs follow-up"].map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                  <span>{s}</span><button className="text-muted-foreground hover:text-rose-600"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2 border-t border-border pt-4">
          <button className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted">Reset</button>
          <button className="flex-1 rounded-xl bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-600">Apply Filters</button>
        </div>
      </div>
    </div>
  );
}

function LeadDetailDrawer({ lead, onClose, onEdit }) {
  const [tab, setTab] = useState("timeline");
  const tabs = [
    { id: "timeline", label: "Timeline" },
    { id: "notes", label: "Notes" },
    { id: "meetings", label: "Meetings" },
    { id: "tasks", label: "Tasks" },
    { id: "emails", label: "Emails" },
    { id: "files", label: "Files" },
    { id: "deals", label: "Deals" },
  ];
  const timeline = [
    { icon: UserIcon, title: "Lead created", subtitle: `Source: ${lead.source}`, time: lead.createdDate, tone: "bg-indigo-500" },
    { icon: PhoneCall, title: "Called client", subtitle: "12 min call · Discussed pricing", time: "2 days ago", tone: "bg-emerald-500" },
    { icon: Mail, title: "Sent email", subtitle: "Introduction & product overview", time: "3 days ago", tone: "bg-blue-500" },
    { icon: StickyNote, title: "Note added", subtitle: "Interested in bulk pricing for Q4", time: "5 days ago", tone: "bg-amber-500" },
    { icon: FileText, title: "Proposal sent", subtitle: "Q3 supply agreement · v1", time: "1 week ago", tone: "bg-violet-500" },
    { icon: CheckCircle2, title: "Status changed to Contacted", subtitle: `By ${lead.assignedTo}`, time: "1 week ago", tone: "bg-cyan-500" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto bg-background shadow-2xl animate-slide-in-right">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-start gap-4 p-6">
            <UserAvatar name={lead.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold">{lead.name}</h2>
                <StatusBadge status={lead.status} />
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">{lead.company} · {lead.email}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <QAction icon={Phone} label="Call" tone="emerald" />
                <QAction icon={Mail} label="Email" tone="blue" />
                <QAction icon={MessageSquare} label="WhatsApp" tone="green" />
                <QAction icon={Calendar} label="Meeting" tone="violet" />
                <QAction icon={StickyNote} label="Note" tone="amber" />
                <QAction icon={Handshake} label="Deal" tone="orange" />
                <QAction icon={CheckCircle2} label="Follow-up Done" tone="indigo" />
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="flex justify-end px-6 pb-2">
            <button onClick={() => onEdit(lead)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-indigo-400 hover:text-indigo-600">
              <Pencil size={12} /> Edit Lead
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto px-4">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("border-b-2 px-3 py-2.5 text-xs font-medium transition", tab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-[1fr,220px]">
          <div>
            {tab === "timeline" && (
              <ol className="relative space-y-5 border-l-2 border-dashed border-border pl-6">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className={cn("absolute -left-[33px] top-0 grid h-7 w-7 place-items-center rounded-full text-white shadow-md", t.tone)}>
                      <t.icon size={13} />
                    </span>
                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={11} /> {t.time}</div>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{t.subtitle}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {tab !== "timeline" && (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted"><Sparkles size={18} className="text-muted-foreground" /></div>
                <div className="mt-3 text-sm font-semibold">Nothing here yet</div>
                <div className="mt-1 text-xs text-muted-foreground">Add the first {tab} to see it here.</div>
                <button className="mt-4 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white">Add {tab.slice(0, -1)}</button>
              </div>
            )}
          </div>
          <aside className="space-y-3 text-sm">
            <InfoRow label="Service / Job" value={lead.service || "General Advisory"} highlight />
            <InfoRow label="Phone" value={lead.phone} />
            <InfoRow label="Source" value={lead.source} />
            <InfoRow label="Assigned" value={lead.assignedTo} />
            <InfoRow label="Created" value={lead.createdDate} />
            <InfoRow label="Last Contact" value={lead.lastContacted} />
            <InfoRow label="Next Follow-up" value={lead.nextFollowUp} highlight />
          </aside>
        </div>
      </div>
    </div>
  );
}

function QAction({ icon: Icon, label, tone }) {
  const tones = {
    emerald: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10",
    blue: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10",
    green: "hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-500/10",
    violet: "hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10",
    amber: "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10",
    orange: "hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10",
    indigo: "hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10",
  };
  return (
    <button className={cn("inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium transition", tones[tone])}>
      <Icon size={12} /> {label}
    </button>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-xs font-medium", highlight && "text-indigo-600")}>{value}</div>
    </div>
  );
}

function AddLeadModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Add New Lead</h2>
            <p className="text-xs text-muted-foreground">Capture a prospect and start engaging.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
        </div>
        <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <Field label="Lead Name *" placeholder="e.g. Priya Patel" required />
          <Field label="Company *" placeholder="e.g. Orion Exports" required />
          <Field label="Service / Job *" as="select" options={serviceNames} required />
          <Field label="Phone" placeholder="+91 90000 12345" />
          <Field label="Email *" placeholder="name@company.com" type="email" required />
          <Field label="Source" placeholder="Website" as="select" options={["Website", "LinkedIn", "Referral", "Cold Call", "Trade Show"]} />
          <Field label="Assigned To" placeholder="Nikhil Rao" as="select" options={["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai"]} />
          <Field label="Status" placeholder="New" as="select" options={statuses} />
          <Field label="Follow-up Date" type="date" />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold">Notes</label>
            <textarea rows={3} placeholder="Any context worth remembering…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
          </div>
          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">Create Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", required, as, options }) {
  const base = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20";
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      {as === "select" ? (
        <select className={base} required={required}>
          {options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} className={base} required={required} />
      )}
    </div>
  );
}

const ENQUIRY_STATUSES = ["Open", "In Progress", "Awaiting Response", "On Hold", "Qualified", "Closed - Won", "Closed - Dead"];
const DEAD_REASONS = ["Budget Constraints", "Chose Competitor", "No Response", "Not a Fit", "Timing Issues", "Duplicate Lead", "Invalid Contact", "Other"];
const MEETING_TYPES = ["Not Scheduled", "Discovery Call", "Product Demo", "Proposal Review", "Negotiation", "Site Visit", "Follow-up", "Closed"];

function EditLeadModal({ lead, onClose }) {
  const [enquiryStatus, setEnquiryStatus] = useState("Open");
  const [deadReason, setDeadReason] = useState("");
  const base = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20";
  const isDead = enquiryStatus === "Closed - Dead";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar name={lead.name} size="md" />
            <div>
              <h2 className="text-lg font-bold">Edit Lead</h2>
              <p className="text-xs text-muted-foreground">{lead.name} · {lead.company} · {lead.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={16} /></button>
        </div>

        <form className="mt-5 space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Basic Details</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Lead Name" placeholder={lead.name} />
              <Field label="Company" placeholder={lead.company} />
              <Field label="Service / Job" as="select" options={serviceNames} defaultValue={lead.service} />
              <Field label="Phone" placeholder={lead.phone} />
              <Field label="Email" type="email" placeholder={lead.email} />
              <Field label="Source" as="select" options={["Website", "LinkedIn", "Referral", "Cold Call", "Trade Show"]} />
              <Field label="Assigned To" as="select" options={["Nikhil Rao", "Simran Kaur", "Kabir Malhotra", "Anjali Desai"]} />
              <Field label="Lead Status" as="select" options={statuses} />
              <Field label="Next Follow-up" type="date" />
            </div>
          </section>

          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Enquiry</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Enquiry Status</label>
                <select value={enquiryStatus} onChange={(e) => setEnquiryStatus(e.target.value)} className={base}>
                  {ENQUIRY_STATUSES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Enquiry Dead Reason {isDead && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={deadReason}
                  onChange={(e) => setDeadReason(e.target.value)}
                  disabled={!isDead}
                  className={cn(base, !isDead && "cursor-not-allowed opacity-50")}
                >
                  <option value="">Select reason…</option>
                  {DEAD_REASONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                {!isDead && <p className="mt-1 text-[10px] text-muted-foreground">Available when Enquiry Status is "Closed - Dead"</p>}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Website Details</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input type="url" placeholder="https://example.com" className={cn(base, "pl-9")} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Leave blank if not available</p>
              </div>
              <Field label="Company Size" as="select" options={["Not specified", "1-10", "11-50", "51-200", "201-500", "500+"]} />
              <Field label="Region / Country" placeholder="e.g. UAE, Singapore" />
            </div>
          </section>

          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Meeting</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Meeting Type" as="select" options={MEETING_TYPES} />
              <Field label="Meeting Date & Time" type="datetime-local" />
              <Field label="Meeting Mode" as="select" options={["In Person", "Video Call", "Phone Call", "On-site Visit"]} />
              <Field label="Meeting Outcome" as="select" options={["Pending", "Positive", "Neutral", "Needs Follow-up", "Not Interested"]} />
            </div>
          </section>

          <section>
            <label className="mb-1 block text-xs font-semibold">Notes</label>
            <textarea rows={3} placeholder="Update notes about this lead…" className={base} />
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
