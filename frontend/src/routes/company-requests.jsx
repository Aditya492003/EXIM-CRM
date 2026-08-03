import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Building2, CheckCircle2, XCircle, Clock, ShieldCheck, User,
  Mail, Loader2, Sparkles, Inbox, Send, ArrowRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/company-requests")({
  component: CompanyRequestsPage,
});

export default function CompanyRequestsPage() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState("incoming"); // "incoming" | "outgoing"
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/company-requests");
      setIncoming(res.data?.incoming || []);
      setOutgoing(res.data?.outgoing || []);
    } catch (err) {
      console.error("Failed to load company requests:", err);
      toast.error("Failed to load company access requests");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (reqId, compName) => {
    try {
      setActionId(reqId);
      const res = await api.patch(`/company-requests/${reqId}/approve`);
      toast.success(res.data?.message || `Access granted for "${compName}"`);
      fetchRequests();
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (reqId, compName) => {
    try {
      setActionId(reqId);
      const res = await api.patch(`/company-requests/${reqId}/reject`);
      toast.info(res.data?.message || `Request for "${compName}" rejected`);
      fetchRequests();
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionId(null);
    }
  };

  const pendingIncoming = incoming.filter((r) => r.status === "Pending");
  const pendingOutgoing = outgoing.filter((r) => r.status === "Pending");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-500" /> Workspace Data Sharing
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Company Access Requests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage cross-manager company sharing requests to prevent duplicate data entry.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab("incoming")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer",
              activeTab === "incoming"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <Inbox size={15} /> Incoming Requests
            {pendingIncoming.length > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {pendingIncoming.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("outgoing")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer",
              activeTab === "outgoing"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <Send size={15} /> Sent Requests
            {pendingOutgoing.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {pendingOutgoing.length}
              </span>
            )}
          </button>
        </div>

        {/* Requests Content */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-500" />
            <div className="mt-3 text-xs font-medium">Loading access requests...</div>
          </div>
        ) : activeTab === "incoming" ? (
          <IncomingRequestsList
            requests={incoming}
            actionId={actionId}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <OutgoingRequestsList requests={outgoing} />
        )}
      </div>
    </AppLayout>
  );
}

function IncomingRequestsList({ requests, actionId, onApprove, onReject }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <Inbox className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-3 text-sm font-bold">No Incoming Access Requests</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          When other managers or employees request access to companies in your workspace, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {requests.map((req) => (
        <div
          key={req._id}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-indigo-200 transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{req.companyName}</h3>
                <div className="text-xs text-muted-foreground">Requested Company Access</div>
              </div>
            </div>
            <StatusBadge status={req.status} />
          </div>

          <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Requested By:</span>
              <span className="font-bold text-foreground">{req.requestedByName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Email:</span>
              <span className="font-semibold text-foreground">{req.requestedByEmail || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Role:</span>
              <span className="capitalize font-semibold text-indigo-600">{req.requestedByRole}</span>
            </div>
            {req.reason && (
              <div className="pt-1 text-[11px] italic text-muted-foreground border-t border-border/50">
                "{req.reason}"
              </div>
            )}
            <div className="pt-1 text-[10px] text-muted-foreground text-right">
              Requested: {new Date(req.createdDate).toLocaleString("en-IN")}
            </div>
          </div>

          {req.status === "Pending" && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onApprove(req._id, req.companyName)}
                disabled={actionId === req._id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
              >
                {actionId === req._id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Approve Access
              </button>
              <button
                onClick={() => onReject(req._id, req.companyName)}
                disabled={actionId === req._id}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 disabled:opacity-50"
              >
                <XCircle size={14} /> Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OutgoingRequestsList({ requests }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <Send className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-3 text-sm font-bold">No Outgoing Access Requests</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          When you request access to existing companies owned by other managers, your request statuses will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {requests.map((req) => (
        <div
          key={req._id}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-indigo-200 transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{req.companyName}</h3>
                <div className="text-xs text-muted-foreground">Target Company</div>
              </div>
            </div>
            <StatusBadge status={req.status} />
          </div>

          <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Owner Manager:</span>
              <span className="font-bold text-foreground">{req.ownerManagerName || "Workspace Manager"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Manager Email:</span>
              <span className="font-semibold text-foreground">{req.ownerManagerEmail || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Requested By:</span>
              <span className="font-semibold text-foreground">{req.requestedByName}</span>
            </div>
            <div className="pt-1 text-[10px] text-muted-foreground text-right">
              Sent: {new Date(req.createdDate).toLocaleString("en-IN")}
            </div>
          </div>

          {req.status === "Approved" && (
            <div className="rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={14} /> Granted! Company is now visible in your workspace.
            </div>
          )}
          {req.status === "Pending" && (
            <div className="rounded-xl bg-amber-50 p-2.5 text-center text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center gap-1.5">
              <Clock size={14} /> Pending review by Manager {req.ownerManagerName || "Owner"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
        <CheckCircle2 size={12} /> Approved
      </span>
    );
  }
  if (status === "Rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
        <XCircle size={12} /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
      <Clock size={12} /> Pending Approval
    </span>
  );
}
