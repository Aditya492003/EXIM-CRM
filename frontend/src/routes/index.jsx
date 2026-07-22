import { createFileRoute } from "@tanstack/react-router";
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
  dealsByStage,
  leadGrowth,
  leadSources,
  leads,
  monthlyRevenue,
  performance,
  proposals,
  proposalStatusColors,
  proposalTotals,
  totals,
} from "@/data/dummy";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

const pieColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

const kpis = [
  { label: "Total Leads", value: totals.totalLeads, delta: "+12.4%", icon: Users, tone: "from-indigo-500 to-blue-500" },
  { label: "New Leads Today", value: totals.newLeadsToday, delta: "+3", icon: Sparkles, tone: "from-violet-500 to-fuchsia-500" },
  { label: "Active Companies", value: totals.activeCompanies, delta: "+2", icon: Building2, tone: "from-cyan-500 to-sky-500" },
  { label: "Open Deals", value: totals.openDeals, delta: "+5", icon: Handshake, tone: "from-amber-500 to-orange-500" },
  { label: "Proposals Sent", value: proposalTotals.total, delta: `${proposalTotals.winRate}% win`, icon: FileText, tone: "from-emerald-500 to-teal-500" },
  { label: "Proposal Value", value: `₹${(proposalTotals.pipelineValue / 100000).toFixed(1)}L`, delta: "+18.2%", icon: DollarSign, tone: "from-rose-500 to-pink-500" },
];

function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overview</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Good morning, Nikhil 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's what's happening across your pipeline today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted">
              <FileText size={14} /> Export Report
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-2 text-xs font-medium text-white shadow-md shadow-indigo-500/20 hover:shadow-lg">
              <Plus size={14} /> New Lead
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((k) => (
            <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl transition group-hover:opacity-40", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-2xl font-bold tracking-tight">{k.value}</div>
                <div className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                  <ArrowUpRight size={12} />
                  {k.delta}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Lead Growth" subtitle="Monthly acquisition trend" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={leadGrowth}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 90%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="leads" stroke="url(#lg)" strokeWidth={3} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Lead Sources" subtitle="Where leads come from">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={leadSources} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {leadSources.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2">
              {leadSources.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Deals by Stage" subtitle="Current pipeline distribution">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dealsByStage} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {dealsByStage.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Revenue" subtitle="Closed & realized" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 90%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {[
            { label: "Add Lead", icon: Users, tone: "from-indigo-500 to-blue-500" },
            { label: "Add Company", icon: Building2, tone: "from-cyan-500 to-teal-500" },
            { label: "Create Deal", icon: Handshake, tone: "from-amber-500 to-orange-500" },
            { label: "Schedule Meeting", icon: Video, tone: "from-violet-500 to-fuchsia-500" },
          ].map((q) => (
            <button key={q.label} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-105", q.tone)}>
                <q.icon size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">{q.label}</div>
                <div className="text-xs text-muted-foreground">Quick action</div>
              </div>
              <Plus className="ml-auto text-muted-foreground transition group-hover:text-foreground" size={16} />
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Recent Leads" subtitle="Latest activity" icon={<Users size={16} className="text-indigo-500" />} className="lg:col-span-2">
            <div className="divide-y divide-border">
              {leads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={l.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{l.company} · {l.assignedTo}</div>
                  </div>
                  <StatusBadge status={l.status} />
                  <div className="hidden text-right text-[11px] text-muted-foreground md:block">
                    <div>Last contact</div>
                    <div className="font-medium text-foreground">{l.lastContacted}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Top Companies" subtitle="Most active this month" icon={<Building2 size={16} className="text-cyan-500" />}>
            <div className="space-y-3">
              {companiesData.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-xs font-bold text-white shadow-sm">
                    {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.industry}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">{c.activeDeals} deals</div>
                    <div className="text-[10px] text-muted-foreground">₹{(c.revenue / 1000).toFixed(0)}k</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card
          title="Recent Proposals"
          subtitle={`${proposalTotals.approved} approved · ${proposalTotals.underReview} under review · Win rate ${proposalTotals.winRate}%`}
          icon={<FileText size={16} className="text-emerald-500" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">Proposal</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Valid till</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proposals.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="py-2.5">
                      <div className="font-medium">{p.number}</div>
                      <div className="text-[11px] text-muted-foreground">{p.service}</div>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{p.client}</td>
                    <td className="py-2.5 font-semibold">₹{(p.value / 1000).toFixed(0)}k</td>
                    <td className="py-2.5">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", proposalStatusColors[p.status])}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[11px] text-muted-foreground">{p.validTill}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <Link to="/proposals" className="text-xs font-semibold text-indigo-600 hover:underline">View all proposals →</Link>
          </div>
        </Card>

        <Card title="Team Performance" subtitle="Quota progress" icon={<TrendingUp size={16} className="text-emerald-500" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {performance.map((p) => (
              <div key={p.name} className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={p.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.deals} deals · ₹{(p.revenue / 1000).toFixed(0)}k</div>
                  </div>
                  <div className="text-right text-sm font-bold text-indigo-600">{p.achieved}%</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${p.achieved}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span><span>Target: 100%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid hsl(215 20% 90%)",
  fontSize: 12,
  boxShadow: "0 10px 25px -12px rgba(0,0,0,0.15)",
  padding: "8px 12px",
};

function ChartCard({ title, subtitle, children, className }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <MailPlus size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function Card({ title, subtitle, icon, children, className }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
