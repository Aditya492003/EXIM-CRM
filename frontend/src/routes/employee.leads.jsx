import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, Phone, Mail, X, Calendar, StickyNote,
  Loader2, RefreshCw, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/employee/leads")({
  component: EmployeeLeadsPage,
});

const statuses = ["New", "Contacted", "Interested", "Proposal Sent", "Negotiation", "Converted", "Lost", "Inactive"];

const statusColors = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  Contacted: "bg-sky-100 text-sky-700 border-sky-200",
  Interested: "bg-violet-100 text-violet-700 border-violet-200",
  "Proposal Sent": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Negotiation: "bg-amber-100 text-amber-700 border-amber-200",
  Converted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Lost: "bg-rose-100 text-rose-700 border-rose-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

function EmployeeLeadsPage() {
  const api = useApi();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/leads?search=${search}`);
      setLeads(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id, status) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
    try {
      await api.patch(`/leads/${id}/status`, { status });
      toast.success(`Status updated to "${status}"`);
    } catch (error) {
      toast.error("Failed to update status — please try again");
      fetchLeads(); // revert
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Leads</h1>
            <p className="text-sm text-muted-foreground">{leads.length} leads assigned to you</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchLeads} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search by name, company, email..."
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
                  <th className="px-5 py-3">Lead Name</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Next Follow-up</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No leads assigned to you yet.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Your manager will assign leads to you from the Manager Portal.</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveLead(l)} className="font-semibold hover:text-indigo-600 text-left">
                          {l.name}
                        </button>
                        {l.service && <div className="text-[11px] text-muted-foreground mt-0.5">{l.service}</div>}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{l.company || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{l.phone || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{l.email || "—"}</td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-80 focus:outline-none transition", statusColors[l.status] || "border-slate-200 bg-slate-50 text-slate-700")}>
                              {l.status} <ChevronDown size={11} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {statuses.map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(l._id, s)}>
                                <span className={cn("mr-2 h-2 w-2 rounded-full inline-block", statusColors[s]?.split(" ")[0])} />
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {l.phone && <a href={`tel:${l.phone}`} className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition" title="Call"><Phone size={14} /></a>}
                          {l.email && <a href={`mailto:${l.email}`} className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition" title="Email"><Mail size={14} /></a>}
                          <button onClick={() => setActiveLead(l)} className="rounded-lg p-1.5 hover:bg-muted hover:text-foreground transition" title="Notes & Follow-up">
                            <StickyNote size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lead Detail & Notes Drawer */}
      {activeLead && (
        <LeadNotesDrawer
          lead={activeLead}
          onClose={() => setActiveLead(null)}
          onSaved={() => { setActiveLead(null); fetchLeads(); }}
          api={api}
        />
      )}
    </AppLayout>
  );
}

function LeadNotesDrawer({ lead, onClose, onSaved, api }) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [nextFollowUp, setNextFollowUp] = useState(
    lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/leads/${lead._id}/notes`, {
        notes,
        nextFollowUp: nextFollowUp || null,
        lastContacted: new Date().toISOString(),
      });
      toast.success("Notes & follow-up saved!");
      onSaved();
    } catch (err) {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md bg-background shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-bold text-lg">{lead.name}</h2>
            <p className="text-xs text-muted-foreground">{lead.company} · {lead.service}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={18} /></button>
        </div>

        {/* Info Grid */}
        <div className="border-b border-border bg-muted/30 px-6 py-4 grid grid-cols-2 gap-3 text-xs">
          <div><div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Status</div>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusColors[lead.status] || "border-slate-200 bg-slate-50 text-slate-700")}>{lead.status}</span>
          </div>
          <div><div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Source</div><span className="font-medium">{lead.source || "—"}</span></div>
          {lead.phone && <div><div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Phone</div><a href={`tel:${lead.phone}`} className="font-medium text-indigo-600 hover:underline">{lead.phone}</a></div>}
          {lead.email && <div><div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Email</div><a href={`mailto:${lead.email}`} className="font-medium text-indigo-600 hover:underline truncate block">{lead.email}</a></div>}
        </div>

        {/* Editable Section */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> Next Follow-up Date</label>
            <input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5"><StickyNote size={13} /> Notes & Activity</label>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record your call, meeting outcome, or any important context about this lead..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
