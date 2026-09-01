import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
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
  Loader2,
  Trash2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import {
  proposals as initialProposals,
  proposalTotals,
} from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

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
  const api = useApi();
  const [proposalList, setProposalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/proposals");
      const data = res.data?.data || [];

      setProposalList(data.map(p => ({
        id: p.number || p._id,
        _id: p._id,
        number: p.number,
        title: p.title || p.service || "Advisory Proposal",
        client: p.client || "",
        service: p.service || "",
        owner: p.owner || "Team Member",
        value: p.value ? `₹${Number(p.value).toLocaleString("en-IN")}` : "—",
        status: p.status || "Draft",
        sentDate: p.sentDate
          ? new Date(p.sentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : (p.createdDate ? new Date(p.createdDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"),
        validUntil: p.validTill ? new Date(p.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
      })));
    } catch (err) {
      console.error("Failed to load proposals", err);
      setProposalList([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleStatusChange = async (id, mongoId, newStatus) => {
    setProposalList((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    if (mongoId) {
      try {
        await api.patch(`/proposals/${mongoId}/status`, { status: newStatus });
        toast.success(`Proposal status updated to ${newStatus}`);
      } catch (err) {
        toast.error("Failed to update proposal status");
        fetchProposals();
      }
    }
  };

  const handleDelete = async (proposal) => {
    if (!confirm(`Delete proposal "${proposal.number || proposal.title}"?`)) return;
    try {
      if (proposal._id) {
        await api.delete(`/proposals/${proposal._id}`);
      }
      setProposalList(prev => prev.filter(p => (p._id || p.id) !== (proposal._id || proposal.id)));
      toast.success("Proposal deleted");
    } catch (err) {
      toast.error("Failed to delete proposal");
    }
  };

  const rows = useMemo(() => {
    return proposalList.filter((p) => {
      const matchesQ =
        !query ||
        [p.number, p.client, p.service, p.owner, p.title].some((v) =>
          v && v.toLowerCase().includes(query.toLowerCase()),
        );
      const matchesS = status === "All" || p.status === status;
      return matchesQ && matchesS;
    });
  }, [proposalList, query, status]);

  const kpis = [
    { label: "Total Proposals", value: proposalList.length, tone: "from-indigo-500 to-violet-500", icon: FileText },
    { label: "Approved", value: proposalList.filter(p => p.status === "Approved").length, tone: "from-emerald-500 to-teal-500", icon: CheckCircle2 },
    { label: "Under Review", value: proposalList.filter(p => p.status === "Under Review" || p.status === "Sent").length, tone: "from-amber-500 to-orange-500", icon: Clock3 },
    { label: "Draft Proposals", value: proposalList.filter(p => p.status === "Draft").length, tone: "from-purple-500 to-indigo-500", icon: FileText },
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
              <Plus size={14} /> Create Proposal
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold tracking-tight">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by proposal #, client, service, owner…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap",
                  status === s ? "bg-indigo-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Proposal #</th>
                  <th className="px-4 py-3">Title / Service</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">Loading proposals from MongoDB...</div>
                    </td>
                  </tr>
                ) : rows.map((p) => (
                  <tr key={p._id || p.id} className="group hover:bg-muted/40 transition">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{p.number || p.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{p.title}</div>
                      <div className="text-[11px] text-muted-foreground">{p.service}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{p.client}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, p._id, e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                      >
                        {statusFilters.filter(s => s !== "All").map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.sentDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(p)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No proposals match filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
