import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, X, FileText, Loader2, RefreshCw, Plus, Mail, Send, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/employee/proposals")({
  component: EmployeeProposalsPage,
});

const proposalStatuses = ["Draft", "Sent", "Under Review", "Approved", "Rejected", "Expired"];

const proposalStatusColors = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Sent: "bg-blue-100 text-blue-700 border-blue-200",
  "Under Review": "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  Expired: "bg-orange-100 text-orange-700 border-orange-200",
};

function EmployeeProposalsPage() {
  const api = useApi();
  const [proposals, setProposals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProposalForEmail, setSelectedProposalForEmail] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/proposals?search=${search}`);
      setProposals(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleStatusChange = async (id, status) => {
    setProposals(prev => prev.map(p => p._id === id ? { ...p, status } : p));
    try {
      await api.patch(`/proposals/${id}/status`, { status });
      toast.success(`Status updated to "${status}"`);
    } catch (error) {
      toast.error("Failed to update status — please try again");
      fetchProposals();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Proposals</h1>
            <p className="text-sm text-muted-foreground">{proposals.length} proposals in your employee pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/proposals/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} /> Create Proposal
            </Link>
            <button onClick={fetchProposals} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search proposals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Proposal</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sent Date</th>
                  <th className="px-5 py-3">Valid Till</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="8" className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : proposals.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No proposals yet.</p>
                      <Link
                        to="/proposals/new"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <Plus size={13} /> Create your first proposal
                      </Link>
                    </td>
                  </tr>
                ) : (
                  proposals.map((p) => (
                    <tr key={p._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-indigo-600">{p.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{p.number}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <div>{p.client || "—"}</div>
                        {p.clientEmail && <div className="text-[11px] text-indigo-500 font-medium">{p.clientEmail}</div>}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{p.service || "—"}</td>
                      <td className="px-5 py-4 font-medium">
                        {p.value ? `₹${p.value.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-80 focus:outline-none transition", proposalStatusColors[p.status] || "border-slate-200 bg-slate-50 text-slate-700")}>
                              {p.status} <ChevronDown size={11} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {proposalStatuses.map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(p._id, s)}>
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs font-medium">
                        {p.sentDate ? new Date(p.sentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : (p.createdDate ? new Date(p.createdDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—")}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {p.validTill ? new Date(p.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedProposalForEmail(p)}
                          className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300"
                          title="Send Proposal Email to Client"
                        >
                          <Mail size={13} /> Send Email
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Send Proposal Email Modal */}
      {selectedProposalForEmail && (
        <SendProposalEmailModal
          proposal={selectedProposalForEmail}
          onClose={() => setSelectedProposalForEmail(null)}
          onSuccess={fetchProposals}
        />
      )}
    </AppLayout>
  );
}

function SendProposalEmailModal({ proposal, onClose, onSuccess }) {
  const api = useApi();
  const [recipientEmail, setRecipientEmail] = useState(proposal.clientEmail || "");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPass, setSenderPass] = useState("");
  const [showCustomSender, setShowCustomSender] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      toast.error("Please enter recipient client email address");
      return;
    }
    try {
      setSending(true);
      const payload = {
        proposalId: proposal._id,
        recipientEmail: recipientEmail.trim(),
        clientName: proposal.client,
        proposalNumber: proposal.number,
        title: proposal.title,
        serviceName: proposal.service,
        serviceFee: String(proposal.value || 0),
      };

      if (senderEmail.trim()) payload.senderEmail = senderEmail.trim();
      if (senderPass.trim()) payload.senderPass = senderPass.trim();

      const res = await api.post("/proposals/send-email", payload);

      if (res.data?.success) {
        toast.success(res.data?.message || `Proposal email delivered to ${recipientEmail}!`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Failed to send proposal email", err);
      toast.error(err.response?.data?.message || "Failed to send proposal email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold">Send Proposal Email</h2>
              <p className="text-xs text-muted-foreground">{proposal.number} · {proposal.client}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Recipient Client Email Address</label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. client@company.com"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Toggle Custom Employee Sender Email */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowCustomSender(!showCustomSender)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              {showCustomSender ? "▲ Hide Custom Sender Settings" : "▼ Send from My Own Gmail Account (Optional)"}
            </button>

            {showCustomSender && (
              <div className="mt-3 space-y-3 rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-3.5 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/20">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Your Sender Gmail Address</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g. your.name@gmail.com"
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Your Google App Password</label>
                  <input
                    type="password"
                    value={senderPass}
                    onChange={(e) => setSenderPass(e.target.value)}
                    placeholder="e.g. abcd efgh ijkl mnop"
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to send using the main company email account.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5 text-muted-foreground">
            <div><strong className="text-foreground">Proposal Ref:</strong> {proposal.number}</div>
            <div><strong className="text-foreground">Engagement Title:</strong> {proposal.service || proposal.title}</div>
            <div><strong className="text-foreground">Status:</strong> Will be updated to "Sent"</div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Email via Nodemailer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
