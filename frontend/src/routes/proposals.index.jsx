import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  DollarSign,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import {
  proposals,
  proposalStatusColors,
  proposalTotals,
} from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/proposals/")({
  component: ProposalsPage,
});

const statusFilters = [
  "All",
  "Draft",
  "Sent",
  "Under Review",
  "Approved",
  "Rejected",
  "Expired",
];

function ProposalsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const rows = useMemo(() => {
    return proposals.filter((p) => {
      const matchesQ =
        !query ||
        [p.number, p.client, p.service, p.owner, p.title].some((v) =>
          v.toLowerCase().includes(query.toLowerCase()),
        );
      const matchesS = status === "All" || p.status === status;
      return matchesQ && matchesS;
    });
  }, [query, status]);

  const kpis = [
    { label: "Total Proposals", value: proposalTotals.total, tone: "from-indigo-500 to-violet-500", icon: FileText },
    { label: "Approved", value: proposalTotals.approved, tone: "from-emerald-500 to-teal-500", icon: CheckCircle2 },
    { label: "Under Review", value: proposalTotals.underReview, tone: "from-amber-500 to-orange-500", icon: Clock3 },
    { label: "Pipeline Value", value: `₹${(proposalTotals.pipelineValue / 100000).toFixed(1)}L`, tone: "from-rose-500 to-pink-500", icon: DollarSign },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Advisory</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Proposals</h1>
            <p className="mt-1 text-sm text-muted-foreground">Draft, send, and track advisory proposals across every client.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/proposals/templates"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted"
            >
              <FileText size={14} /> Templates
            </Link>
            <Link
              to="/proposals/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg"
            >
              <Plus size={14} /> New Proposal
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-2xl font-bold tracking-tight">{k.value}</div>
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by client, service, proposal number…"
                className="w-full rounded-lg border border-border bg-background px-9 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                    status === s
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-600"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <Filter size={13} /> More
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Proposal</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 font-medium">Service</th>
                  <th className="px-4 py-2.5 font-medium">Value</th>
                  <th className="px-4 py-2.5 font-medium">Billing</th>
                  <th className="px-4 py-2.5 font-medium">Owner</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Valid till</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.id} className="group hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{p.number}</div>
                      <div className="text-[11px] text-muted-foreground">{p.template}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.client}</div>
                      <div className="text-[11px] text-muted-foreground">{p.contact}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.service}</td>
                    <td className="px-4 py-3 font-semibold">₹{(p.value / 1000).toFixed(0)}k</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.billing}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={p.owner} size="sm" />
                        <span className="text-xs">{p.owner}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", proposalStatusColors[p.status])}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{p.validTill}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Download">
                          <Download size={14} />
                        </button>
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Send">
                          <Send size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No proposals match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <div>Showing {rows.length} of {proposals.length}</div>
            <div className="flex gap-1">
              <button className="rounded-md border border-border px-2 py-1 hover:bg-muted">Prev</button>
              <button className="rounded-md border border-border px-2 py-1 hover:bg-muted">Next</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
