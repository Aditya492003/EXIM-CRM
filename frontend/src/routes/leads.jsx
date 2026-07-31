import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Columns3, Download,
  Filter, MessageSquare, MoreHorizontal, Phone, Plus, RefreshCw, Search,
  Sparkles, Star, Trash2, Upload, X, Mail, FileText, Handshake, CheckCircle2,
  Clock, User as UserIcon, PhoneCall, StickyNote, Pencil, Globe, Loader2, Building2,
  ExternalLink, ShieldCheck, Tag
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { leads as dummyLeads } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});

const statuses = ["New", "Contacted", "Interested", "Proposal Sent", "Negotiation", "Converted", "Lost", "Inactive"];
const quickFilters = ["All Leads", "Today's Leads", "New Leads", "Unassigned", "Follow-up Today", "Overdue", "Favorites"];

const ENQUIRY_STATUSES = ["Open", "In Progress", "Awaiting Response", "On Hold", "Qualified", "Closed - Won", "Closed - Dead"];
const DEAD_REASONS = ["Budget Constraints", "Chose Competitor", "No Response", "Not a Fit", "Timing Issues", "Duplicate Lead", "Invalid Contact", "Other"];
const MEETING_TYPES = ["Not Scheduled", "Discovery Call", "Product Demo", "Proposal Review", "Negotiation", "Site Visit", "Follow-up", "Closed"];

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
  const api = useApi();
  const [leadsList, setLeadsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [enquiryFilter, setEnquiryFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("");
  const [quick, setQuick] = useState("All Leads");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [openFilter, setOpenFilter] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(new Set(DEFAULT_COLUMNS));
  const [openColumns, setOpenColumns] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/leads");
      const data = res.data?.data || [];

      const formatted = data.map(l => ({
        id: l.code || l._id,
        _id: l._id,
        name: l.name,
        company: l.company || "",
        service: l.service || "",
        phone: l.phone || "",
        email: l.email || "",
        source: l.source || "Website",
        assignedTo: l.assignedTo || "Nikhil Rao",
        status: l.status || "New",
        isFavorite: l.isFavorite || false,
        createdDate: l.createdDate ? new Date(l.createdDate).toLocaleDateString("en-IN") : "",
        lastContacted: l.lastContacted ? new Date(l.lastContacted).toLocaleDateString("en-IN") : "",
        nextFollowUp: l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString("en-IN") : "",
        notes: l.notes || "",
        enquiryStatus: l.enquiryStatus || "Open",
        deadReason: l.deadReason || "",
        websiteUrl: l.websiteUrl || "",
        companySize: l.companySize || "Not specified",
        region: l.region || "",
        meetingType: l.meetingType || "Not Scheduled",
        meetingDate: l.meetingDate ? new Date(l.meetingDate).toISOString().slice(0, 16) : "",
        meetingMode: l.meetingMode || "Video Call",
        meetingOutcome: l.meetingOutcome || "Pending",
      }));
      setLeadsList(formatted);
      const favSet = new Set(formatted.filter(l => l.isFavorite).map(l => l.id));
      setFavorites(favSet);
    } catch (err) {
      console.error("Failed to load leads", err);
      setLeadsList([]);
      setFavorites(new Set());
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Real-time backend sync on inline status dropdown change
  const handleStatusChange = async (id, newStatus, mongoId) => {
    setLeadsList((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    if (mongoId) {
      try {
        await api.patch(`/leads/${mongoId}/status`, { status: newStatus });
        toast.success(`Status updated to ${newStatus}`);
      } catch (err) {
        toast.error("Failed to update status in DB");
        fetchLeads();
      }
    }
  };

  // Real-time backend sync on favorite toggle
  const toggleFav = async (id, mongoId) => {
    const next = new Set(favorites);
    next.has(id) ? next.delete(id) : next.add(id);
    setFavorites(next);
    setLeadsList((prev) => prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l)));

    if (mongoId) {
      try {
        await api.patch(`/leads/${mongoId}/favorite`);
      } catch (err) {
        console.error("Failed to toggle favorite", err);
      }
    }
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Are you sure you want to delete lead "${lead.name}"?`)) return;
    try {
      if (lead._id) {
        await api.delete(`/leads/${lead._id}`);
      }
      setLeadsList(prev => prev.filter(l => (l._id || l.id) !== (lead._id || lead.id)));
      if (active && (active._id === lead._id || active.id === lead.id)) setActive(null);
      toast.success("Lead deleted successfully");
    } catch (err) {
      toast.error("Failed to delete lead");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/leads/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "leads.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Exported leads to CSV");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const toggleCol = (key) => {
    const next = new Set(visibleCols);
    next.has(key) ? next.delete(key) : next.add(key);
    setVisibleCols(next);
  };
  const isVisible = (key) => visibleCols.has(key);

  const availableSources = useMemo(() => {
    const defaultList = ["All", "Website", "LinkedIn", "Referral", "Cold Call", "Trade Show", "Partner", "Google Ads", "Other"];
    const fromData = leadsList.map((l) => l.source).filter(Boolean);
    return Array.from(new Set([...defaultList, ...fromData]));
  }, [leadsList]);

  const availableAssigned = useMemo(() => {
    const set = new Set(leadsList.map((l) => l.assignedTo).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [leadsList]);

  const availableServices = useMemo(() => {
    const set = new Set(leadsList.map((l) => l.service).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [leadsList]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "All") count++;
    if (sourceFilter !== "All") count++;
    if (assignedFilter !== "All") count++;
    if (serviceFilter !== "All") count++;
    if (enquiryFilter !== "All") count++;
    if (regionFilter.trim() !== "") count++;
    return count;
  }, [statusFilter, sourceFilter, assignedFilter, serviceFilter, enquiryFilter, regionFilter]);

  const resetFilters = useCallback(() => {
    setStatusFilter("All");
    setSourceFilter("All");
    setAssignedFilter("All");
    setServiceFilter("All");
    setEnquiryFilter("All");
    setRegionFilter("");
  }, []);

  const filtered = useMemo(() => {
    let out = leadsList;
    if (statusFilter !== "All") out = out.filter((l) => l.status === statusFilter);
    if (sourceFilter !== "All") out = out.filter((l) => l.source === sourceFilter);
    if (assignedFilter !== "All") out = out.filter((l) => l.assignedTo === assignedFilter);
    if (serviceFilter !== "All") out = out.filter((l) => l.service === serviceFilter);
    if (enquiryFilter !== "All") out = out.filter((l) => (l.enquiryStatus || "Open") === enquiryFilter);
    if (regionFilter.trim()) {
      const r = regionFilter.toLowerCase().trim();
      out = out.filter((l) => l.region && l.region.toLowerCase().includes(r));
    }

    if (quick === "New Leads") out = out.filter((l) => l.status === "New");
    else if (quick === "Favorites") out = out.filter((l) => favorites.has(l.id));
    else if (quick === "Today's Leads") {
      const todayStr = new Date().toLocaleDateString("en-IN");
      out = out.filter((l) => l.createdDate === todayStr);
    } else if (quick === "Unassigned") {
      out = out.filter((l) => !l.assignedTo || l.assignedTo === "Unassigned");
    } else if (quick === "Follow-up Today") {
      const todayStr = new Date().toLocaleDateString("en-IN");
      out = out.filter((l) => l.nextFollowUp === todayStr);
    } else if (quick === "Overdue") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      out = out.filter((l) => {
        if (!l.nextFollowUp) return false;
        const d = new Date(l.nextFollowUp);
        return !isNaN(d) && d < today;
      });
    }

    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s) ||
          l.company.toLowerCase().includes(s) ||
          (l.service && l.service.toLowerCase().includes(s)) ||
          l.phone.includes(s) ||
          (l.region && l.region.toLowerCase().includes(s)),
      );
    }
    return out;
  }, [leadsList, statusFilter, sourceFilter, assignedFilter, serviceFilter, enquiryFilter, regionFilter, quick, search, favorites]);

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

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sales Workspace</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} of {leadsList.length} leads · {selected.size} selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOpenFilter(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer",
                activeFilterCount > 0
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              <Filter size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <IconButton onClick={handleExportCSV}><Download size={14} /> Export CSV</IconButton>
            <div className="relative">
              <IconButton onClick={() => setOpenColumns(!openColumns)}>
                <Columns3 size={14} /> Columns
              </IconButton>
              {openColumns && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-xl border border-border bg-card p-2 shadow-xl animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Toggle Columns</div>
                  {ALL_COLUMNS.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-muted cursor-pointer">
                      <input type="checkbox" checked={isVisible(c.key)} onChange={() => toggleCol(c.key)} className="rounded border-border" />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} /> Add Lead
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
          {quickFilters.map((q) => (
            <button
              key={q}
              onClick={() => { setQuick(q); setPage(1); }}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap",
                quick === q ? "bg-indigo-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, email, phone…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400"
            >
              <option value="All">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-muted-foreground font-medium text-[11px]">Active Filters:</span>
            {statusFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("All")} className="hover:text-indigo-900 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {sourceFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Source: {sourceFilter}
                <button onClick={() => setSourceFilter("All")} className="hover:text-indigo-900 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {assignedFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Assigned: {assignedFilter}
                <button onClick={() => setAssignedFilter("All")} className="hover:text-indigo-900 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {serviceFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Service: {serviceFilter}
                <button onClick={() => setServiceFilter("All")} className="hover:text-indigo-900 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {enquiryFilter !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Enquiry: {enquiryFilter}
                <button onClick={() => setEnquiryFilter("All")} className="hover:text-indigo-900 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            {regionFilter.trim() !== "" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                Region: {regionFilter}
                <button onClick={() => setRegionFilter("")} className="hover:text-indigo-900 cursor-pointer"><X size={12} /></button>
              </span>
            )}
            <button onClick={resetFilters} className="text-[11px] text-muted-foreground underline hover:text-foreground cursor-pointer">
              Clear all
            </button>
          </div>
        )}

        {/* Main Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={paginated.length > 0 && paginated.every((l) => selected.has(l.id))} onChange={toggleAll} className="rounded border-border" />
                  </th>
                  <th className="w-8 px-2 py-3" />
                  {ALL_COLUMNS.filter((c) => isVisible(c.key)).map((c) => (
                    <th key={c.key} className="px-4 py-3">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">Loading leads from MongoDB Atlas...</div>
                    </td>
                  </tr>
                ) : paginated.map((l) => (
                  <tr key={l._id || l.id} className="group hover:bg-muted/40 transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleOne(l.id)} className="rounded border-border" />
                    </td>
                    <td className="px-2 py-3">
                      <button onClick={() => toggleFav(l.id, l._id)} className="text-muted-foreground hover:text-amber-400 cursor-pointer">
                        <Star size={14} className={cn(favorites.has(l.id) && "fill-amber-400 text-amber-400")} />
                      </button>
                    </td>

                    {isVisible("lead") && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={l.name} size="sm" />
                          <div>
                            <button onClick={() => setActive(l)} className="font-semibold text-foreground hover:text-indigo-600 text-left cursor-pointer underline decoration-indigo-200">
                              {l.name}
                            </button>
                            <div className="text-[11px] text-muted-foreground">{l.id}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {isVisible("company") && <td className="px-4 py-3 font-medium">{l.company}</td>}
                    {isVisible("service") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.service}</td>}
                    {isVisible("phone") && <td className="px-4 py-3 text-xs">{l.phone}</td>}
                    {isVisible("email") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.email}</td>}
                    {isVisible("source") && <td className="px-4 py-3 text-xs">{l.source}</td>}
                    {isVisible("assigned") && <td className="px-4 py-3 text-xs font-medium">{l.assignedTo}</td>}

                    {isVisible("status") && (
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => handleStatusChange(l.id, e.target.value, l._id)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    )}

                    {isVisible("created") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.createdDate}</td>}
                    {isVisible("lastContact") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.lastContacted}</td>}
                    {isVisible("nextFollowUp") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.nextFollowUp}</td>}

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => setActive(l)} title="View Detail Drawer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => setEditing(l)} title="Edit Lead" className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(l)} title="Delete Lead" className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-muted-foreground">
                      <Sparkles size={24} className="mx-auto text-muted-foreground/60" />
                      <div className="mt-2 font-medium text-sm">No leads match criteria</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>Showing {Math.min((page - 1) * pageSize + 1, filtered.length)} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40 cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40 cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer when clicking Lead */}
      {active && (
        <LeadDetailDrawer
          lead={active}
          onClose={() => setActive(null)}
          onEdit={() => { setEditing(active); setActive(null); }}
          onDelete={() => handleDelete(active)}
        />
      )}

      {openFilter && (
        <FilterLeadsModal
          onClose={() => setOpenFilter(false)}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
          assignedFilter={assignedFilter} setAssignedFilter={setAssignedFilter}
          serviceFilter={serviceFilter} setServiceFilter={setServiceFilter}
          enquiryFilter={enquiryFilter} setEnquiryFilter={setEnquiryFilter}
          regionFilter={regionFilter} setRegionFilter={setRegionFilter}
          availableSources={availableSources}
          availableAssigned={availableAssigned}
          availableServices={availableServices}
          onReset={resetFilters}
        />
      )}

      {openAdd && <AddLeadModal onClose={() => setOpenAdd(false)} onSuccess={fetchLeads} />}
      {editing && <EditLeadModal lead={editing} onClose={() => setEditing(null)} onSuccess={fetchLeads} />}
    </AppLayout>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer">
      {children}
    </button>
  );
}

// Searchable Company Combobox Component
function CompanySearchSelect({ value, onChange, onCompanySelect }) {
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
        console.error("Failed to fetch companies for select", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [api]);

  const filtered = useMemo(() => {
    if (!value) return companies;
    const q = value.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, value]);

  return (
    <div className="relative">
      <input
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Clear autofill when user types manually
          onCompanySelect?.(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type to search company name…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl animate-fade-in">
            {loading ? (
              <div className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin text-indigo-500" /> Loading companies…
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    onCompanySelect?.(c);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-xs text-left hover:bg-muted cursor-pointer transition gap-1"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-indigo-500 shrink-0" />
                      <span className="font-semibold text-foreground">{c.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.industry || "Company"}</span>
                  </div>
                  {/* Email & Phone availability hint */}
                  <div className="flex items-center gap-3 pl-5">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium",
                      c.email ? "text-emerald-600" : "text-muted-foreground/60"
                    )}>
                      <Mail size={9} />
                      {c.email ? c.email : "Email not saved"}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-medium",
                      c.phone ? "text-emerald-600" : "text-muted-foreground/60"
                    )}>
                      <Phone size={9} />
                      {c.phone ? c.phone : "Phone not saved"}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-2.5 text-center text-xs text-muted-foreground">
                No existing company matching "<span className="font-semibold text-foreground">{value}</span>".
                <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">New company name will be saved automatically with this lead.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Reusable Employee Select Component (Fetches live from DB)
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

// Reusable Service Select Component (Fetches live from DB)
function ServiceSelect({ value, onChange }) {
  const api = useApi();
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        const list = res.data?.data || [];
        setServices(list);
        if (!value && list.length > 0) {
          onChange(list[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
      }
    };
    fetchServices();
  }, [api]);

  const hasValue = value && services.some((s) => s.name === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
    >
      {services.length === 0 ? (
        <option value="">No services found</option>
      ) : (
        <>
          {value && !hasValue && <option value={value}>{value}</option>}
          {services.map((s) => (
            <option key={s._id || s.name} value={s.name}>
              {s.name} ({s.fee ? `₹${s.fee.toLocaleString("en-IN")}` : s.price || "₹0"})
            </option>
          ))}
        </>
      )}
    </select>
  );
}

/* ── Full Interactive Lead Detail Drawer ──────────────── */
function LeadDetailDrawer({ lead, onClose, onEdit, onDelete }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl bg-background p-6 shadow-2xl overflow-y-auto animate-slide-left flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={lead.name} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-foreground">{lead.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-indigo-600">{lead.company}</span>
                  <span className="text-xs text-muted-foreground">· {lead.id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer" title="Edit Lead">
                <Pencil size={16} />
              </button>
              <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer" title="Delete Lead">
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={18} /></button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => window.open(`tel:${lead.phone}`)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <PhoneCall size={16} className="text-indigo-500" />
              <span>Call</span>
            </button>
            <button onClick={() => window.open(`mailto:${lead.email}`)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <Mail size={16} className="text-indigo-500" />
              <span>Email</span>
            </button>
            <button onClick={onEdit} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <Calendar size={16} className="text-indigo-500" />
              <span>Meeting</span>
            </button>
            <button onClick={onEdit} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <Pencil size={16} className="text-indigo-500" />
              <span>Edit</span>
            </button>
          </div>

          {/* Tabs Header */}
          <div className="flex border-b border-border text-xs font-medium text-muted-foreground">
            {["overview", "enquiry", "meeting", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 capitalize transition border-b-2 cursor-pointer",
                  tab === t ? "border-indigo-600 font-bold text-indigo-600" : "border-transparent hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {tab === "overview" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-muted/30">
                <InfoItem label="Status" value={lead.status} highlight />
                <InfoItem label="Assigned Manager" value={lead.assignedTo} />
                <InfoItem label="Service / Job" value={lead.service} />
                <InfoItem label="Lead Source" value={lead.source} />
                <InfoItem label="Phone" value={lead.phone || "Not provided"} />
                <InfoItem label="Email" value={lead.email || "Not provided"} />
                <InfoItem label="Created Date" value={lead.createdDate || "Recently"} />
                <InfoItem label="Next Follow-up" value={lead.nextFollowUp || "None set"} />
              </div>

              {lead.websiteUrl && (
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-indigo-500" />
                    <span className="font-medium">{lead.websiteUrl}</span>
                  </div>
                  <a href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
                    Visit <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {tab === "enquiry" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
                <InfoItem label="Enquiry Status" value={lead.enquiryStatus || "Open"} highlight />
                {lead.deadReason && <InfoItem label="Dead Reason" value={lead.deadReason} danger />}
                <InfoItem label="Company Size" value={lead.companySize || "Not specified"} />
                <InfoItem label="Region / Country" value={lead.region || "India"} />
              </div>
            </div>
          )}

          {tab === "meeting" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
                <InfoItem label="Meeting Type" value={lead.meetingType || "Not Scheduled"} />
                <InfoItem label="Date & Time" value={lead.meetingDate ? new Date(lead.meetingDate).toLocaleString("en-IN") : "Not set"} />
                <InfoItem label="Mode" value={lead.meetingMode || "Video Call"} />
                <InfoItem label="Outcome" value={lead.meetingOutcome || "Pending"} />
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 bg-muted/30 whitespace-pre-wrap">
                {lead.notes || "No notes recorded yet for this lead."}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight, danger }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-xs font-medium", highlight && "text-indigo-600 font-bold", danger && "text-rose-600 font-bold")}>{value}</div>
    </div>
  );
}

/* ── Add Lead Modal ──────────────────────────────────── */
export function AddLeadModal({ defaultCompany = "", defaultCompanyId = "", onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [autofilled, setAutofilled] = useState({ phone: false, email: false, websiteUrl: false });
  const [formData, setFormData] = useState({
    name: "",
    company: defaultCompany || "",
    service: "DGFT Advisory",
    phone: "",
    email: "",
    source: "Website",
    assignedTo: "Nikhil Rao",
    status: "New",
    websiteUrl: "",
    region: "",
    notes: "",
  });

  /* Auto-fill phone, email, website when a company is selected from dropdown */
  const handleCompanySelect = (companyObj) => {
    if (!companyObj) {
      setAutofilled({ phone: false, email: false, websiteUrl: false });
      return;
    }
    const updates = {};
    const filled = { phone: false, email: false, websiteUrl: false };
    if (companyObj.phone) { updates.phone = companyObj.phone; filled.phone = true; }
    if (companyObj.email) { updates.email = companyObj.email; filled.email = true; }
    if (companyObj.website) { updates.websiteUrl = companyObj.website; filled.websiteUrl = true; }
    setFormData(prev => ({ ...prev, ...updates }));
    setAutofilled(filled);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/leads", formData);
      toast.success("Lead created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create lead error", err);
      toast.error(err.response?.data?.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  /* Reusable autofill badge */
  const AutofilledBadge = () => (
    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      <CheckCircle2 size={9} /> Auto-filled
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">Add New Lead</h2>
            <p className="text-xs text-muted-foreground">Capture a prospect and start engaging.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Lead Name *</label>
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Priya Patel" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Company Name *</label>
              <CompanySearchSelect
                value={formData.company}
                onChange={(val) => setFormData({ ...formData, company: val })}
                onCompanySelect={handleCompanySelect}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Service / Job *</label>
              <ServiceSelect
                value={formData.service}
                onChange={(val) => setFormData({ ...formData, service: val })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold">
                Phone
                {autofilled.phone && <AutofilledBadge />}
              </label>
              <input
                value={formData.phone}
                onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setAutofilled(p => ({ ...p, phone: false })); }}
                placeholder={autofilled.phone ? "" : "+91 90000 12345"}
                className={cn(
                  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-1",
                  autofilled.phone
                    ? "border-emerald-400 bg-emerald-50/60 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-border focus:border-indigo-400 focus:ring-indigo-100"
                )}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold">
                Email *
                {autofilled.email && <AutofilledBadge />}
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setAutofilled(p => ({ ...p, email: false })); }}
                placeholder={autofilled.email ? "" : "name@company.com"}
                className={cn(
                  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-1",
                  autofilled.email
                    ? "border-emerald-400 bg-emerald-50/60 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-border focus:border-indigo-400 focus:ring-indigo-100"
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Source</label>
              <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {["Website", "LinkedIn", "Referral", "Cold Call", "Trade Show", "Partner", "Google Ads", "Other"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Assigned To</label>
              <EmployeeSelect
                value={formData.assignedTo}
                onChange={(val) => setFormData({ ...formData, assignedTo: val })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold">
                Website URL
                {autofilled.websiteUrl && <AutofilledBadge />}
              </label>
              <input
                value={formData.websiteUrl}
                onChange={(e) => { setFormData({ ...formData, websiteUrl: e.target.value }); setAutofilled(p => ({ ...p, websiteUrl: false })); }}
                placeholder={autofilled.websiteUrl ? "" : "https://example.com"}
                className={cn(
                  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-1",
                  autofilled.websiteUrl
                    ? "border-emerald-400 bg-emerald-50/60 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-border focus:border-indigo-400 focus:ring-indigo-100"
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Region / Country</label>
              <input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="e.g. UAE, Singapore" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Notes</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any context worth remembering…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />} Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* ── Rich Multi-Section Edit Lead Modal ───────────────── */
function EditLeadModal({ lead, onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: lead?.name || "",
    company: lead?.company || "",
    service: lead?.service || "DGFT Advisory",
    phone: lead?.phone || "",
    email: lead?.email || "",
    source: lead?.source || "Website",
    assignedTo: lead?.assignedTo || "Nikhil Rao",
    status: lead?.status || "New",
    nextFollowUp: lead?.nextFollowUp || "",
    enquiryStatus: lead?.enquiryStatus || "Open",
    deadReason: lead?.deadReason || "",
    websiteUrl: lead?.websiteUrl || "",
    companySize: lead?.companySize || "Not specified",
    region: lead?.region || "",
    meetingType: lead?.meetingType || "Not Scheduled",
    meetingDate: lead?.meetingDate || "",
    meetingMode: lead?.meetingMode || "Video Call",
    meetingOutcome: lead?.meetingOutcome || "Pending",
    notes: lead?.notes || "",
  });

  const isDead = formData.enquiryStatus === "Closed - Dead";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (lead._id) {
        await api.put(`/leads/${lead._id}`, formData);
        toast.success("Lead updated successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Update lead error", err);
      toast.error(err.response?.data?.message || "Failed to update lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={formData.name} size="md" />
            <div>
              <h2 className="text-lg font-bold">Edit Lead</h2>
              <p className="text-xs text-muted-foreground">{lead.name} · {lead.company} · {lead.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
          {/* Section 1: Basic Details */}
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Basic Details</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Lead Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Company Name *</label>
                <CompanySearchSelect
                  value={formData.company}
                  onChange={(val) => setFormData({ ...formData, company: val })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Service / Job *</label>
                <ServiceSelect
                  value={formData.service}
                  onChange={(val) => setFormData({ ...formData, service: val })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Phone</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Email *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Source</label>
                <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {["Website", "LinkedIn", "Referral", "Cold Call", "Trade Show", "Partner", "Google Ads", "Other"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Assigned To</label>
                <EmployeeSelect
                  value={formData.assignedTo}
                  onChange={(val) => setFormData({ ...formData, assignedTo: val })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Lead Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Enquiry */}
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Enquiry Status & Dead Reason</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Enquiry Status</label>
                <select value={formData.enquiryStatus} onChange={(e) => setFormData({ ...formData, enquiryStatus: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {ENQUIRY_STATUSES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Enquiry Dead Reason {isDead && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={formData.deadReason}
                  onChange={(e) => setFormData({ ...formData, deadReason: e.target.value })}
                  disabled={!isDead}
                  className={cn("w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400", !isDead && "cursor-not-allowed opacity-50")}
                >
                  <option value="">Select reason…</option>
                  {DEAD_REASONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                {!isDead && <p className="mt-1 text-[10px] text-muted-foreground">Available when Enquiry Status is "Closed - Dead"</p>}
              </div>
            </div>
          </section>

          {/* Section 3: Website Details */}
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Website & Company Details</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Company Size</label>
                <select value={formData.companySize} onChange={(e) => setFormData({ ...formData, companySize: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {["Not specified", "1-10", "11-50", "51-200", "201-500", "500+"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Region / Country</label>
                <input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="e.g. UAE, Singapore" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
            </div>
          </section>

          {/* Section 4: Meeting */}
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Meeting Schedule</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Meeting Type</label>
                <select value={formData.meetingType} onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {MEETING_TYPES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Meeting Date & Time</label>
                <input type="datetime-local" value={formData.meetingDate} onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Meeting Mode</label>
                <select value={formData.meetingMode} onChange={(e) => setFormData({ ...formData, meetingMode: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {["In Person", "Video Call", "Phone Call", "On-site Visit"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Meeting Outcome</label>
                <select value={formData.meetingOutcome} onChange={(e) => setFormData({ ...formData, meetingOutcome: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                  {["Pending", "Positive", "Neutral", "Needs Follow-up", "Not Interested"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Section 5: Notes */}
          <section>
            <label className="mb-1 block text-xs font-semibold">Notes & Engagement Context</label>
            <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Update notes about this lead…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          </section>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Filter Leads Modal ────────────────────────────── */
function FilterLeadsModal({
  onClose,
  statusFilter, setStatusFilter,
  sourceFilter, setSourceFilter,
  assignedFilter, setAssignedFilter,
  serviceFilter, setServiceFilter,
  enquiryFilter, setEnquiryFilter,
  regionFilter, setRegionFilter,
  availableSources, availableAssigned, availableServices,
  onReset
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl animate-scale-in space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">Filter Leads</h2>
            <p className="text-xs text-muted-foreground">Filter lead records across status, source, advisor, service, and region.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">Lead Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer">
              <option value="All">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-semibold text-foreground">Lead Source</label>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer">
                {availableSources.map((s) => <option key={s} value={s}>{s === "All" ? "All Sources" : s}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-foreground">Assigned To</label>
              <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer">
                {availableAssigned.map((a) => <option key={a} value={a}>{a === "All" ? "All Staff" : a}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-foreground">Service / Job</label>
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer">
                {availableServices.map((s) => <option key={s} value={s}>{s === "All" ? "All Services" : s}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-foreground">Enquiry Status</label>
              <select value={enquiryFilter} onChange={(e) => setEnquiryFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer">
                <option value="All">All Enquiry Statuses</option>
                {ENQUIRY_STATUSES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-foreground">Region / Country</label>
            <input
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              placeholder="e.g. UAE, Singapore, Mumbai"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-border px-3.5 py-2 text-xs font-medium hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

