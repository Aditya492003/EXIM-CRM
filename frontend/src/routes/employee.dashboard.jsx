import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Users, Handshake, FileText, Building2, ChevronDown, Loader2,
  Calendar, Clock, Video, CheckCircle2, ArrowUpRight, Filter,
  Sparkles, RefreshCw, CalendarDays, Search, Check, AlertCircle,
  Briefcase, ArrowRight, ShieldAlert, Layers, Bell, Trash2, MessageSquare, X
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "@/lib/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/dashboard")({
  component: EmployeeDashboard,
});

const WORKING_STATUSES = ["Available", "Working on Leads", "On Leave"];

const statusBadgeStyles = {
  Available: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
  "Working on Leads": "bg-blue-500/20 text-blue-100 border-blue-400/40",
  "On Leave": "bg-amber-500/20 text-amber-100 border-amber-400/40",
};

const workTypeColors = {
  Meeting: {
    badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    icon: Video,
    dot: "bg-purple-500",
  },
  "Lead Follow-up": {
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    icon: Users,
    dot: "bg-blue-500",
  },
  Deal: {
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    icon: Handshake,
    dot: "bg-amber-500",
  },
  Proposal: {
    badge: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    icon: FileText,
    dot: "bg-rose-500",
  },
};

function EmployeeDashboard() {
  const { user } = useUser();
  const api = useApi();
  const firstName = user?.firstName || "Employee";

  const [stats, setStats] = useState({ leads: 0, deals: 0, companies: 0, proposals: 0, meetings: 0 });
  const [profile, setProfile] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loadingWork, setLoadingWork] = useState(true);

  // Raw assigned work items
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [proposals, setProposals] = useState([]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Date Filter State: "today" | "tomorrow" | "week" | "all" | custom date string
  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingWork(true);
      const [lRes, dRes, cRes, pRes, mRes, profRes] = await Promise.all([
        api.get("/leads").catch(() => ({ data: { data: [], total: 0 } })),
        api.get("/deals").catch(() => ({ data: { data: [], total: 0 } })),
        api.get("/companies").catch(() => ({ data: { data: [], total: 0 } })),
        api.get("/proposals").catch(() => ({ data: { data: [], total: 0 } })),
        api.get("/meetings/employee").catch(() => ({ data: { data: [], total: 0 } })),
        api.get("/employees/me").catch(() => null),
      ]);

      const leadList = lRes.data?.data || [];
      const dealList = dRes.data?.data || [];
      const companyList = cRes.data?.data || [];
      const propList = pRes.data?.data || [];
      const meetList = mRes.data?.data || [];

      setLeads(leadList);
      setDeals(dealList);
      setProposals(propList);
      setMeetings(meetList);

      setStats({
        leads: lRes.data?.total || leadList.length,
        deals: dRes.data?.total || dealList.length,
        companies: cRes.data?.total || companyList.length,
        proposals: pRes.data?.total || propList.length,
        meetings: mRes.data?.total || meetList.length,
      });

      if (profRes?.data?.data) {
        setProfile(profRes.data.data);
      }

      // Fetch active manager notifications for employee (past 24h)
      api.get("/notifications/my")
        .then((res) => setNotifications(res.data?.data || []))
        .catch((err) => console.error("Failed to load notifications", err));
    } catch (err) {
      console.error("Failed to load employee dashboard data", err);
    } finally {
      setLoadingWork(false);
    }
  }, [api]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.patch("/employees/status", { workingStatus: newStatus });
      if (res.data?.success) {
        setProfile(res.data.data);
        toast.success(`Status updated to "${newStatus}" — synced with Manager Portal!`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStatus = profile?.workingStatus || "Available";

  // Build unified assigned work list
  const allAssignedWork = useMemo(() => {
    const items = [];

    // 1. Meetings
    meetings.forEach((m) => {
      items.push({
        id: `meet-${m._id}`,
        type: "Meeting",
        title: m.title,
        company: m.company || "Client Meeting",
        date: m.date ? new Date(m.date) : null,
        dateStr: m.date ? new Date(m.date).toISOString().slice(0, 10) : "",
        timeStr: m.time || "Scheduled",
        status: m.outcomeStatus ? `Outcome: ${m.outcomeStatus}` : m.status || "Scheduled",
        statusType: m.outcomeStatus ? "completed" : "pending",
        link: "/employee/meetings",
        raw: m,
      });
    });

    // 2. Leads (follow-ups)
    leads.forEach((l) => {
      items.push({
        id: `lead-${l._id}`,
        type: "Lead Follow-up",
        title: `Follow-up with ${l.name}`,
        company: l.company || l.service || "Assigned Lead",
        date: l.nextFollowUp ? new Date(l.nextFollowUp) : l.createdDate ? new Date(l.createdDate) : null,
        dateStr: l.nextFollowUp ? new Date(l.nextFollowUp).toISOString().slice(0, 10) : "",
        timeStr: l.nextFollowUp ? "Follow-up due" : "Assigned",
        status: l.status || "Active",
        statusType: "pending",
        link: "/employee/leads",
        raw: l,
      });
    });

    // 3. Deals
    deals.forEach((d) => {
      items.push({
        id: `deal-${d._id}`,
        type: "Deal",
        title: d.title,
        company: d.company || "Client Deal",
        date: d.createdDate ? new Date(d.createdDate) : null,
        dateStr: d.createdDate ? new Date(d.createdDate).toISOString().slice(0, 10) : "",
        timeStr: d.value ? `₹${Number(d.value).toLocaleString("en-IN")}` : "In Pipeline",
        status: d.stage || "In Progress",
        statusType: d.stage === "Won" ? "completed" : "pending",
        link: "/employee/deals",
        raw: d,
      });
    });

    // 4. Proposals
    proposals.forEach((p) => {
      items.push({
        id: `prop-${p._id}`,
        type: "Proposal",
        title: p.title || `Proposal ${p.proposalNumber || ""}`,
        company: p.companyName || "Client Proposal",
        date: p.createdDate ? new Date(p.createdDate) : null,
        dateStr: p.createdDate ? new Date(p.createdDate).toISOString().slice(0, 10) : "",
        timeStr: p.proposalNumber || "Proposal",
        status: p.status || "Draft",
        statusType: p.status === "Approved" ? "completed" : "pending",
        link: "/employee/proposals",
        raw: p,
      });
    });

    return items;
  }, [meetings, leads, deals, proposals]);

  // Date Filtering Logic
  const filteredWorkList = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

    const endOfWeekObj = new Date();
    endOfWeekObj.setDate(endOfWeekObj.getDate() + 7);

    return allAssignedWork.filter((item) => {
      // Type Filter
      if (typeFilter !== "All" && item.type !== typeFilter) return false;

      // Date Filter
      if (dateFilter === "today") {
        if (!item.dateStr) return true; // Include items without explicit date in today's active list
        return item.dateStr === todayStr;
      }
      if (dateFilter === "tomorrow") {
        return item.dateStr === tomorrowStr;
      }
      if (dateFilter === "week") {
        if (!item.date) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return item.date >= now && item.date <= endOfWeekObj;
      }
      if (dateFilter === "custom" && customDate) {
        return item.dateStr === customDate;
      }
      return true; // "all"
    });
  }, [allAssignedWork, dateFilter, customDate, typeFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Aesthetic Glassmorphic Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-white/10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <Sparkles size={14} className="text-indigo-400" />
                EXIM Consultant Work Portal
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Welcome back, {profile?.name || firstName} 👋
              </h1>
              <p className="mt-1 text-xs text-indigo-200/80">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                <span className="font-semibold text-white">{filteredWorkList.length} tasks scheduled for display</span>
              </p>
            </div>

            {/* Interactive Status Selector */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={updatingStatus}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition shadow-md cursor-pointer disabled:opacity-50",
                      statusBadgeStyles[currentStatus] || "bg-blue-500/20 text-white border-blue-300/30"
                    )}
                  >
                    {updatingStatus ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <>
                        <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", currentStatus === "Available" ? "bg-emerald-400" : currentStatus === "On Leave" ? "bg-amber-400" : "bg-blue-400")} />
                        <span>Status: {currentStatus}</span>
                        <ChevronDown size={13} />
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  {WORKING_STATUSES.map((st) => (
                    <DropdownMenuItem key={st} onClick={() => handleStatusUpdate(st)} className="cursor-pointer text-xs font-medium">
                      <span className={cn("mr-2 h-2 w-2 rounded-full inline-block", st === "Available" ? "bg-emerald-500" : st === "On Leave" ? "bg-amber-500" : "bg-blue-500")} />
                      {st}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={fetchDashboardData}
                className="rounded-2xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition cursor-pointer"
                title="Refresh Workspace"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Assigned Companies" value={stats.companies} icon={Building2} color="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" link="/employee/companies" />
          <StatCard title="Assigned Leads" value={stats.leads} icon={Users} color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" link="/employee/leads" />
          <StatCard title="Assigned Meetings" value={stats.meetings} icon={Video} color="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" link="/employee/meetings" />
          <StatCard title="Assigned Deals" value={stats.deals} icon={Handshake} color="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" link="/employee/deals" />
        </div>

        {/* Manager Notifications Banner / Stack Card (Placed directly under 4 Stats Cards) */}
        <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Bell size={20} />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight">Manager Notifications & Instructions</h2>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Auto-expires in 24 Hours
                  </span>
                </div>
                <p className="text-xs text-indigo-200/70">
                  Instruction notes sent by managers. Click any message to open details.
                </p>
              </div>
            </div>
            {notifications.length > 0 && (
              <span className="text-xs text-indigo-300/90 font-semibold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                {notifications.length} active notification{notifications.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Notifications Stack List */}
          <div className="mt-4 space-y-2.5 relative z-10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-indigo-200/60 bg-white/5 rounded-2xl border border-white/5">
                <MessageSquare className="mx-auto h-6 w-6 text-indigo-400/50 mb-1.5" />
                No active notifications from managers right now. New notes will auto-appear here in your dashboard for 24 hours.
              </div>
            ) : (
              notifications.map((n) => {
                const hoursLeft = Math.max(0, Math.round((new Date(n.createdDate).getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60)));
                return (
                  <div
                    key={n._id}
                    onClick={async () => {
                      setSelectedNotif(n);
                      if (!n.read) {
                        try {
                          await api.patch(`/notifications/${n._id}/read`);
                          setNotifications((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
                        } catch (e) {}
                      }
                    }}
                    className={cn(
                      "group flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition cursor-pointer hover:translate-x-0.5",
                      n.read
                        ? "border-white/10 bg-white/5 text-indigo-100/90 hover:bg-white/10"
                        : "border-indigo-400/50 bg-indigo-500/15 text-white shadow-md ring-1 ring-indigo-400/30 hover:bg-indigo-500/20"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", n.read ? "bg-slate-500" : "bg-emerald-400 animate-pulse")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-extrabold text-indigo-300">Manager Note from {n.senderName || "Manager"}</span>
                          <span className="text-[10px] text-indigo-200/60 flex items-center gap-1">
                            <Clock size={10} /> {new Date(n.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-white/95 line-clamp-2 leading-relaxed">
                          {n.note}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 border border-white/10">
                        Deletes in {hoursLeft}h
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await api.delete(`/notifications/${n._id}`);
                            setNotifications((prev) => prev.filter((item) => item._id !== n._id));
                            toast.success("Notification dismissed");
                          } catch (e) {
                            toast.error("Failed to dismiss notification");
                          }
                        }}
                        className="rounded-lg p-1.5 text-indigo-300 hover:bg-white/10 hover:text-rose-400 transition cursor-pointer"
                        title="Dismiss notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ASSIGNED WORK LIST CONTAINER */}
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
          {/* Work List Header & Filter Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold tracking-tight">Assigned Work Schedule</h2>
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300">
                  {filteredWorkList.length} items
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Concise day-by-day list of meetings, follow-ups, deals, and proposals assigned to you.
              </p>
            </div>

            {/* Date & Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Filter Pills */}
              <div className="flex items-center rounded-xl border border-border bg-muted/50 p-1 text-xs font-semibold">
                <button
                  onClick={() => { setDateFilter("today"); setCustomDate(""); }}
                  className={cn("rounded-lg px-3 py-1.5 transition cursor-pointer", dateFilter === "today" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Today
                </button>
                <button
                  onClick={() => { setDateFilter("tomorrow"); setCustomDate(""); }}
                  className={cn("rounded-lg px-3 py-1.5 transition cursor-pointer", dateFilter === "tomorrow" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => { setDateFilter("week"); setCustomDate(""); }}
                  className={cn("rounded-lg px-3 py-1.5 transition cursor-pointer", dateFilter === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  This Week
                </button>
                <button
                  onClick={() => { setDateFilter("all"); setCustomDate(""); }}
                  className={cn("rounded-lg px-3 py-1.5 transition cursor-pointer", dateFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  All Work
                </button>
              </div>

              {/* Custom Date Selector */}
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter("custom");
                }}
                className="h-8 rounded-xl border border-border bg-background px-2.5 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                title="Filter by custom date"
              />

              {/* Work Type Filter Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 rounded-xl border border-border bg-background px-3 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="All">All Work Types</option>
                <option value="Meeting">Meetings</option>
                <option value="Lead Follow-up">Lead Follow-ups</option>
                <option value="Deal">Deals</option>
                <option value="Proposal">Proposals</option>
              </select>
            </div>
          </div>

          {/* WORK SCHEDULE LIST TABLE */}
          {loadingWork ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              <p className="text-xs text-muted-foreground">Syncing assigned work schedule…</p>
            </div>
          ) : filteredWorkList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-14 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 mb-3">
                <CheckCircle2 className="h-6 w-6 text-indigo-500" />
              </div>
              <h3 className="text-sm font-bold">No work scheduled for this filter</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                You're all caught up! Switch date filters or check "All Work" to see future assignments.
              </p>
              <button
                onClick={() => { setDateFilter("all"); setTypeFilter("All"); setCustomDate(""); }}
                className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
              >
                Show All Work
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Work Item</th>
                      <th className="px-4 py-3">Client / Company</th>
                      <th className="px-4 py-3">Scheduled / Due Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredWorkList.map((item) => {
                      const typeCfg = workTypeColors[item.type] || workTypeColors["Meeting"];
                      const TypeIcon = typeCfg.icon;

                      return (
                        <tr key={item.id} className="group hover:bg-muted/40 transition">
                          {/* Work Title */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg border", typeCfg.badge)}>
                                <TypeIcon size={14} />
                              </div>
                              <div className="min-w-0">
                                <Link to={item.link} className="font-bold text-foreground hover:text-indigo-600 truncate block text-sm">
                                  {item.title}
                                </Link>
                              </div>
                            </div>
                          </td>

                          {/* Company / Client */}
                          <td className="px-4 py-3.5 font-medium text-muted-foreground">
                            {item.company}
                          </td>

                          {/* Date & Time */}
                          <td className="px-4 py-3.5 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-400 shrink-0" />
                              <span>{item.dateStr || "Today"} · {item.timeStr}</span>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="px-4 py-3.5">
                            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", typeCfg.badge)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", typeCfg.dot)} />
                              {item.type}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={cn(
                              "rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold",
                              item.statusType === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            )}>
                              {item.status}
                            </span>
                          </td>

                          {/* Direct Link Action */}
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              to={item.link}
                              className="inline-flex items-center gap-1 rounded-xl bg-muted/80 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                            >
                              <span>Open</span>
                              <ArrowUpRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <NotificationDetailModal
          notif={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onDelete={async () => {
            try {
              await api.delete(`/notifications/${selectedNotif._id}`);
              setNotifications((prev) => prev.filter((n) => n._id !== selectedNotif._id));
              setSelectedNotif(null);
              toast.success("Notification dismissed");
            } catch (e) {
              toast.error("Failed to dismiss notification");
            }
          }}
        />
      )}
    </AppLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, link }) {
  return (
    <Link to={link} className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md hover:border-indigo-300">
      <div className="flex items-center justify-between">
        <div className={`w-fit rounded-2xl p-3 ${color}`}>
          <Icon size={20} />
        </div>
        <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-extrabold tracking-tight">{value}</div>
        <div className="text-xs font-semibold text-muted-foreground mt-0.5">{title}</div>
      </div>
    </Link>
  );
}

function NotificationDetailModal({ notif, onClose, onDelete }) {
  const hoursLeft = Math.max(0, Math.round((new Date(notif.createdDate).getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold">Manager Notification Note</h2>
              <p className="text-xs text-muted-foreground">Sent by {notif.senderName || "Manager"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Sender & Timestamp badge */}
        <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">From: {notif.senderName || "Manager"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Clock size={12} />
            <span>{new Date(notif.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>({new Date(notif.createdDate).toLocaleDateString("en-IN")})</span>
          </div>
        </div>

        {/* Full Note Text Content */}
        <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            Instruction Note / Task Details
          </div>
          <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {notif.note}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border">
          <span>Auto-deletion status:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Expires in ~{hoursLeft} hours (24h TTL)
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer"
          >
            <Trash2 size={13} /> Dismiss
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
