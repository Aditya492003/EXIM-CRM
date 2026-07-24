import { createFileRoute, Link } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useCallback } from "react";
import { LandingPage } from "./landing";
import {
  ArrowUpRight,
  Building2,
  DollarSign,
  FileText,
  Handshake,
  MailPlus,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { StatusBadge } from "@/components/crm/StatusBadge";
import {
  companiesData,
  dealsByStage as dummyDealsByStage,
  leadGrowth as dummyLeadGrowth,
  leadSources as dummyLeadSources,
  leads as dummyLeads,
  monthlyRevenue as dummyMonthlyRevenue,
  performance as dummyPerformance,
  proposals as dummyProposals,
  proposalStatusColors,
  proposalTotals,
  totals as dummyTotals,
} from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

const pieColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const api = useApi();

  const [stats, setStats] = useState({ totalLeads: 0, newLeadsToday: 0, activeCompanies: 0, openDeals: 0, totalProposals: 0, pipelineValue: 0 });
  const [growth, setGrowth] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [stageDeals, setStageDeals] = useState([]);
  const [sources, setSources] = useState([]);
  const [teamPerf, setTeamPerf] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [sRes, gRes, rRes, dRes, srcRes, pRes] = await Promise.allSettled([
        api.get("/dashboard/stats"),
        api.get("/dashboard/lead-growth"),
        api.get("/dashboard/revenue"),
        api.get("/dashboard/deals-by-stage"),
        api.get("/dashboard/lead-sources"),
        api.get("/dashboard/performance"),
      ]);

      if (sRes.status === "fulfilled" && sRes.value.data?.data) {
        const d = sRes.value.data.data;
        setStats({
          totalLeads: d.totalLeads || 0,
          newLeadsToday: d.newLeadsToday || 0,
          activeCompanies: d.activeCompanies || 0,
          openDeals: d.openDeals || 0,
          totalProposals: d.totalProposals || 0,
          pipelineValue: d.pipelineValue || 0,
        });
      }

      if (gRes.status === "fulfilled") setGrowth(gRes.value.data?.data || []);
      if (rRes.status === "fulfilled") setRevenue(rRes.value.data?.data || []);
      if (dRes.status === "fulfilled") setStageDeals(dRes.value.data?.data || []);
      if (srcRes.status === "fulfilled") setSources(srcRes.value.data?.data || []);
      if (pRes.status === "fulfilled") setTeamPerf(pRes.value.data?.data || []);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoadingData(false);
    }
  }, [api]);

  useEffect(() => {
    if (isSignedIn) {
      fetchDashboardData();
    }
  }, [isSignedIn, fetchDashboardData]);

  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Loading Exim Nexus…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  const userName =
    user?.firstName ||
    (user?.fullName ? user.fullName.split(" ")[0] : null) ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0] ||
    "there";

  const kpis = [
    { label: "Total Leads", value: stats.totalLeads, delta: "Live", icon: Users, tone: "from-indigo-500 to-blue-500" },
    { label: "New Leads Today", value: stats.newLeadsToday, delta: "Today", icon: Sparkles, tone: "from-violet-500 to-fuchsia-500" },
    { label: "Active Companies", value: stats.activeCompanies, delta: "Active", icon: Building2, tone: "from-cyan-500 to-sky-500" },
    { label: "Open Deals", value: stats.openDeals, delta: "Open", icon: Handshake, tone: "from-amber-500 to-orange-500" },
    { label: "Proposals Sent", value: stats.totalProposals, delta: "Total", icon: FileText, tone: "from-emerald-500 to-teal-500" },
    { label: "Pipeline Value", value: `₹${(stats.pipelineValue / 100000).toFixed(1)}L`, delta: "Pipeline", icon: DollarSign, tone: "from-rose-500 to-pink-500" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overview</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Good day, {userName} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's what's happening across your pipeline today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/leads" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-2 text-xs font-medium text-white shadow-md shadow-indigo-500/20 hover:shadow-lg">
              <Plus size={14} /> New Lead
            </Link>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-xl font-bold tracking-tight sm:text-2xl">{k.value}</div>
                <div className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight size={13} /> {k.delta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold">Monthly Lead Growth</h3>
                <p className="text-xs text-muted-foreground">New acquisition trend over the past 12 months</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <TrendingUp size={14} /> Live Sync
              </div>
            </div>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", color: "#fff", borderRadius: "12px", border: "none" }} />
                  <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="border-b border-border pb-4">
              <h3 className="text-base font-bold">Lead Acquisition Sources</h3>
              <p className="text-xs text-muted-foreground">Distribution across channels</p>
            </div>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {sources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", color: "#fff", borderRadius: "12px", border: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pipeline & Revenue Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-bold">Deals by Stage</h3>
            <p className="text-xs text-muted-foreground">Active opportunity funnel distribution</p>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageDeals}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="stage" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", color: "#fff", borderRadius: "12px", border: "none" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-bold">Closed Revenue Trend</h3>
            <p className="text-xs text-muted-foreground">Monthly closed-won revenue (in ₹)</p>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", color: "#fff", borderRadius: "12px", border: "none" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
