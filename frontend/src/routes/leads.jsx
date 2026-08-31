import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowUpDown, Calendar, ChevronDown, ChevronLeft, ChevronRight, Columns3, Download,
  Filter, MessageSquare, MoreHorizontal, Phone, Plus, RefreshCw, Search,
  Sparkles, Star, Trash2, Upload, X, Mail, FileText, Handshake, CheckCircle2,
  Clock, User as UserIcon, PhoneCall, StickyNote, Pencil, Globe, Loader2, Building2,
  ExternalLink, ShieldCheck, Tag, Briefcase, IndianRupee
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { leads as dummyLeads } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { ConvertLeadToDealModal } from "@/components/crm/ConvertLeadToDealModal";
import { AddMeetingModal } from "@/components/crm/AddMeetingModal";

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
  const [convertingLead, setConvertingLead] = useState(null);
  const [schedulingMeetingLead, setSchedulingMeetingLead] = useState(null);
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
    const currentLead = leadsList.find((l) => l.id === id || l._id === mongoId);

    if (newStatus === "Converted" && currentLead) {
      setConvertingLead({ ...currentLead, status: "Converted", _id: mongoId || currentLead._id });
    }

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
                          className={cn(
                            "rounded-lg border bg-background px-2 py-1 text-xs font-semibold outline-none focus:border-indigo-400 cursor-pointer",
                            l.status === "Converted" ? "border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border"
                          )}
                        >
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {l.status === "Converted" && (
                          <button
                            onClick={() => setConvertingLead(l)}
                            className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 rounded cursor-pointer transition shadow-xs"
                          >
                            <Briefcase size={10} /> Convert to Deal
                          </button>
                        )}
                      </td>
                    )}

                    {isVisible("created") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.createdDate}</td>}
                    {isVisible("lastContact") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.lastContacted}</td>}
                    {isVisible("nextFollowUp") && <td className="px-4 py-3 text-xs text-muted-foreground">{l.nextFollowUp}</td>}

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => setSchedulingMeetingLead(l)}
                          title="Schedule Meeting for this Lead"
                          className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition text-xs"
                        >
                          📅
                        </button>
                        <button onClick={() => setConvertingLead(l)} title="Convert to Deal" className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">
                          <Briefcase size={14} />
                        </button>
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
          onConvertToDeal={() => { setConvertingLead(active); setActive(null); }}
          onScheduleMeeting={() => { setSchedulingMeetingLead(active); }}
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

      {convertingLead && (
        <ConvertLeadToDealModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onSuccess={fetchLeads}
        />
      )}

      {schedulingMeetingLead && (
        <AddMeetingModal
          defaultLead={schedulingMeetingLead}
          onClose={() => setSchedulingMeetingLead(null)}
          onSuccess={() => {
            setSchedulingMeetingLead(null);
            fetchLeads();
          }}
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
function CompanySearchSelect({ value, onChange, onCompanySelect, required = false }) {
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
    if (!value || !value.trim()) return companies;
    const q = value.toLowerCase().trim();
    const cleanQ = q.replace(/&/g, " and ").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"\\]/g, " ");
    const tokens = cleanQ.split(/\s+/).filter(Boolean);

    return companies.filter((c) => {
      const normName = c.name.toLowerCase().replace(/&/g, " and ").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"\\]/g, " ");
      if (normName.includes(cleanQ)) return true;

      return tokens.every((token) => {
        if (token === "pvt" || token === "private") return normName.includes("pvt") || normName.includes("private");
        if (token === "ltd" || token === "limited") return normName.includes("ltd") || normName.includes("limited");
        if (token === "corp" || token === "corporation") return normName.includes("corp") || normName.includes("corporation");
        if (token === "inc" || token === "incorporated") return normName.includes("inc") || normName.includes("incorporated");
        return normName.includes(token);
      });
    });
  }, [companies, value]);

  return (
    <div className="relative">
      <input
        required={required}
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

// Searchable Contact Person Combobox Component (Fetches contacts linked to selected Company)
function ContactPersonSearchSelect({ companyName, value, onChange, onContactSelect, required = true }) {
  const api = useApi();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!companyName || !companyName.trim()) {
      setContacts([]);
      return;
    }

    const fetchCompanyContacts = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/contacts?company=${encodeURIComponent(companyName.trim())}`);
        setContacts(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch company contacts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyContacts();
  }, [api, companyName]);

  const filtered = useMemo(() => {
    if (!value) return contacts;
    const q = value.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, value]);

  return (
    <div className="relative">
      <input
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Contact person name (e.g. Priya Patel)"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      />
      {open && companyName && companyName.trim() && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl animate-fade-in">
            {loading ? (
              <div className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin text-indigo-500" /> Searching contacts for {companyName}…
              </div>
            ) : filtered.length > 0 ? (
              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
                  Existing Contacts at {companyName}
                </div>
                {filtered.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      onChange(c.name);
                      onContactSelect?.({ name: c.name, phone: c.phone || "", email: c.email || "" });
                      setOpen(false);
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-xs text-left hover:bg-muted cursor-pointer transition gap-1"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <UserIcon size={13} className="text-indigo-500 shrink-0" />
                        <span className="font-bold text-foreground">{c.name}</span>
                      </div>
                      {c.designation && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.designation}</span>}
                    </div>
                    <div className="flex items-center gap-3 pl-5 text-[10px] text-muted-foreground">
                      {c.phone && <span>📞 {c.phone}</span>}
                      {c.email && <span>✉️ {c.email}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5 text-center text-xs text-muted-foreground">
                No existing contacts found under "<span className="font-semibold text-foreground">{companyName}</span>".
                <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">New contact will be created automatically when this lead is saved.</div>
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

// Reusable Searchable Service Select Component (Fetches live from DB, removes (₹0), searchable)
function ServiceSelect({ value, onChange, required = true }) {
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
        console.error("Failed to fetch services", err);
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
          placeholder="Type to search service / job…"
          className="w-full rounded-xl border border-border bg-background pl-3 pr-8 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
                No matching service found for "<span className="font-semibold text-foreground">{search}</span>".
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Full Interactive Lead Detail Drawer ──────────────── */
function LeadDetailDrawer({ lead, onClose, onEdit, onDelete, onConvertToDeal, onScheduleMeeting }) {
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
              <button onClick={onConvertToDeal} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer" title="Convert to Deal">
                <Briefcase size={16} />
              </button>
              <button onClick={onScheduleMeeting} className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer" title="Schedule Meeting">
                <Calendar size={16} />
              </button>
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
          <div className="grid grid-cols-5 gap-2">
            <button onClick={() => window.open(`tel:${lead.phone}`)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <PhoneCall size={16} className="text-indigo-500" />
              <span>Call</span>
            </button>
            <button onClick={() => window.open(`mailto:${lead.email}`)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <Mail size={16} className="text-indigo-500" />
              <span>Email</span>
            </button>
            <button onClick={onScheduleMeeting} className="flex flex-col items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/70 p-2.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300 transition cursor-pointer">
              <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Meeting</span>
            </button>
            <button onClick={onConvertToDeal} className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 transition cursor-pointer">
              <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Convert</span>
            </button>
            <button onClick={onEdit} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <Pencil size={16} className="text-indigo-500" />
              <span>Edit</span>
            </button>
          </div>

          {/* Tabs Header */}
          <div className="flex border-b border-border text-xs font-medium text-muted-foreground overflow-x-auto">
            {["overview", "collaborators", "timeline", "enquiry", "meeting", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-2 capitalize transition border-b-2 cursor-pointer shrink-0",
                  tab === t ? "border-indigo-600 font-bold text-indigo-600" : "border-transparent hover:text-foreground"
                )}
              >
                {t === "collaborators" ? `Collaborators (${lead.collaborators?.length || 0})` : t}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {tab === "overview" && (
            <div className="space-y-4 text-xs">
              {lead.status === "Converted" && (
                <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" /> Lead Ready for Deal Conversion
                    </div>
                    <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 mt-0.5">
                      Marked as Converted. Click below to set deal amount and create deal.
                    </p>
                  </div>
                  <button
                    onClick={onConvertToDeal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer shrink-0"
                  >
                    <Briefcase size={13} /> Convert to Deal
                  </button>
                </div>
              )}

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

          {tab === "collaborators" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Active Team Collaborators ({lead.collaborators?.length || 0})</span>
                </div>
                {lead.collaborators && lead.collaborators.length > 0 ? (
                  <div className="space-y-2">
                    {lead.collaborators.map((c) => (
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
                                data: { entityType: "Lead", entityId: lead._id, collaboratorClerkId: c.clerkId }
                              });
                              toast.success(`Removed ${c.name} from collaborators`);
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
                  <div className="text-[11px] text-muted-foreground italic">No collaborators assigned to this lead yet.</div>
                )}
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                <div className="font-bold text-foreground">Lead Activity Timeline</div>
                {lead.timeline && lead.timeline.length > 0 ? (
                  <div className="space-y-3 relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-900">
                    {lead.timeline.map((t, idx) => (
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
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || "";

  const [submitting, setSubmitting] = useState(false);
  const [autofilled, setAutofilled] = useState({ phone: false, email: false, websiteUrl: false });
  const [formData, setFormData] = useState({
    name: "",
    company: defaultCompany || "",
    companyPhone: "",
    companyEmail: "",
    service: "DGFT Advisory",
    phone: "",
    email: "",
    source: "Website",
    assignedTo: currentUserName,
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

  const [duplicateData, setDuplicateData] = useState(null);
  const [companyDuplicateData, setCompanyDuplicateData] = useState(null);
  const [companyPromptData, setCompanyPromptData] = useState(null);
  const [requestingCollab, setRequestingCollab] = useState(false);
  const [requestingCompanyAccess, setRequestingCompanyAccess] = useState(false);

  const handleSubmit = async (e, options = {}) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      setSubmitting(true);
      setDuplicateData(null);
      setCompanyDuplicateData(null);

      const payload = {
        ...formData,
        ...options,
      };

      const res = await api.post("/leads", payload);

      if (res.data?.companyNotFound) {
        setCompanyPromptData({ companyName: res.data.companyName });
        return;
      }

      toast.success(res.data?.message || "Lead created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create lead error", err);
      if (err.response?.data?.isCompanyCrossWorkspaceDuplicate && err.response?.data?.existingCompany) {
        setCompanyDuplicateData(err.response.data.existingCompany);
      } else if (err.response?.data?.isLeadDuplicate && err.response?.data?.existingLead) {
        setDuplicateData(err.response.data.existingLead);
      } else {
        toast.error(err.response?.data?.message || "Failed to create lead");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCompanyChoice = (createCompany) => {
    if (createCompany) {
      handleSubmit(null, { createMissingCompany: true });
    } else {
      handleSubmit(null, { confirmCompany: true });
    }
  };

  const handleRequestCollaboration = async () => {
    if (!duplicateData?._id) return;
    try {
      setRequestingCollab(true);
      const res = await api.post("/collaboration-requests", {
        entityType: "Lead",
        entityId: duplicateData._id,
        reason: "Requesting collaboration on matching business lead opportunity.",
      });
      toast.success(res.data?.message || `Collaboration request sent to ${duplicateData.ownerName}`);
      setDuplicateData(null);
      onClose();
    } catch (err) {
      console.error("Collaboration request error:", err);
      toast.error(err.response?.data?.message || "Failed to send collaboration request");
    } finally {
      setRequestingCollab(false);
    }
  };

  const handleRequestCompanyAccess = async () => {
    if (!companyDuplicateData?._id) return;
    try {
      setRequestingCompanyAccess(true);
      const res = await api.post("/company-requests", {
        companyId: companyDuplicateData._id,
        reason: `Requesting company access to create lead for ${companyDuplicateData.name}`,
      });
      toast.success(res.data?.message || `Access request for "${companyDuplicateData.name}" sent to Manager ${companyDuplicateData.ownerManagerName}!`);
      setCompanyDuplicateData(null);
      onClose();
    } catch (err) {
      console.error("Company request error:", err);
      toast.error(err.response?.data?.message || "Failed to send company access request");
    } finally {
      setRequestingCompanyAccess(false);
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

        {companyDuplicateData ? (
          <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50/90 p-5 dark:border-rose-900/50 dark:bg-rose-950/40 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-rose-950 dark:text-rose-200">
                  Company Already Exists in Another Workspace!
                </h3>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-0.5">
                  Company <strong>{companyDuplicateData.name}</strong> is registered in the system under Manager <strong>{companyDuplicateData.ownerManagerName}</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3.5 text-xs space-y-2 border border-rose-200 shadow-sm text-foreground">
              <div>To prevent duplicate company accounts in the CRM, creating a duplicate company is blocked.</div>
              <div className="pt-2 text-indigo-700 font-bold border-t border-rose-200/60 dark:text-indigo-300">
                Please request company access from Manager {companyDuplicateData.ownerManagerName}. Once approved, you can create leads for this company.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200">
              <button
                type="button"
                onClick={() => setCompanyDuplicateData(null)}
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestCompanyAccess}
                disabled={requestingCompanyAccess}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {requestingCompanyAccess ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />} Request Company Access
              </button>
            </div>
          </div>
        ) : duplicateData ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 dark:border-amber-900/50 dark:bg-amber-950/40 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                <Handshake size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                  Lead Already Exists in Database!
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  A matching lead for <strong>{duplicateData.company}</strong> ({duplicateData.name}) for service <strong>{duplicateData.service}</strong> already exists.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3.5 text-xs space-y-1.5 border border-amber-200 shadow-sm">
              <div><strong>Company Name:</strong> {duplicateData.company}</div>
              <div><strong>Contact Person:</strong> {duplicateData.name}</div>
              <div><strong>Service:</strong> {duplicateData.service}</div>
              <div><strong>Current Status:</strong> <span className="font-semibold text-indigo-600">{duplicateData.status}</span></div>
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
        ) : companyPromptData ? (
          <div className="mt-4 rounded-2xl border border-indigo-300 bg-indigo-50/90 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/40 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200">
                  Company Not Found in Database!
                </h3>
                <p className="text-xs text-indigo-800/90 dark:text-indigo-300/90 mt-0.5">
                  <strong>"{companyPromptData.companyName}"</strong> is not currently saved in your company database.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3.5 text-xs space-y-1 border border-indigo-200 shadow-sm text-foreground">
              <div>Would you like to create a new Company record for <strong>"{companyPromptData.companyName}"</strong> and automatically save <strong>"{formData.name}"</strong> as a linked Contact?</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
              <button
                type="button"
                onClick={() => handleConfirmCompanyChoice(false)}
                disabled={submitting}
                className="rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 cursor-pointer"
              >
                NO, Skip & Create Lead Only
              </button>
              <button
                type="button"
                onClick={() => handleConfirmCompanyChoice(true)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />} YES, Create Company & Link Contact
              </button>
            </div>
          </div>
        ) : (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Contact Person Name *</label>
              <ContactPersonSearchSelect
                companyName={formData.company}
                value={formData.name}
                onChange={(val) => setFormData({ ...formData, name: val })}
                onContactSelect={(c) => {
                  setFormData((prev) => ({
                    ...prev,
                    name: c.name,
                    phone: c.phone || prev.phone,
                    email: c.email || prev.email,
                  }));
                  setAutofilled({
                    phone: !!c.phone,
                    email: !!c.email,
                    websiteUrl: false,
                  });
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Company Name (Optional)</label>
              <CompanySearchSelect
                value={formData.company}
                onChange={(val) => setFormData({ ...formData, company: val })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Company Mobile Number (Optional)</label>
              <input
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                placeholder="e.g. +91 22 1234 5678"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Company Email (Optional)</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                placeholder="e.g. info@company.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
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
                Contact Person Phone
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
                Contact Person Email (Optional)
                {autofilled.email && <AutofilledBadge />}
              </label>
              <input
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
        )}
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
    assignedTo: lead?.assignedTo || "",
    status: lead?.status || "New",
    nextFollowUp: lead?.nextFollowUp || "",
    enquiryStatus: lead?.enquiryStatus || "Open",
    deadReason: lead?.deadReason || "",
    websiteUrl: lead?.websiteUrl || "",
    companySize: lead?.companySize || "Not specified",
    region: lead?.region || "",
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
                <label className="mb-1 block text-xs font-semibold">Contact Person Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Company Name (Optional)</label>
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
                <label className="mb-1 block text-xs font-semibold">Contact Person Phone</label>
                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Contact Person Email (Optional)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
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

          {/* Section 4: Notes */}
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

