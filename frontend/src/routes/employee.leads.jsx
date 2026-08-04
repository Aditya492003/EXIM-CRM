import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, Phone, Mail, X, Calendar, StickyNote,
  Loader2, RefreshCw, MessageSquare, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddLeadModal } from "@/routes/leads";

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
  const [openAdd, setOpenAdd] = useState(false);

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
    setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
    try {
      await api.patch(`/leads/${id}/status`, { status });
      toast.success(`Status updated to "${status}"`);
    } catch (error) {
      toast.error("Failed to update status — please try again");
      fetchLeads();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Leads</h1>
            <p className="text-sm text-muted-foreground">{leads.length} leads in your portal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} /> Add Lead
            </button>
            <button onClick={fetchLeads} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-64">
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
                      <p className="mt-2 text-sm text-muted-foreground">No leads found in your portal.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Click "+ Add Lead" to create a new lead.</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveLead(l)} className="font-semibold hover:text-indigo-600 text-left">
                          {l.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 font-medium text-indigo-600">{l.company || "N/A"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{l.phone || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{l.email || "—"}</td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border cursor-pointer", statusColors[l.status] || "bg-muted text-muted-foreground")}>
                              {l.status} <ChevronDown size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {statuses.map((st) => (
                              <DropdownMenuItem key={st} onClick={() => handleStatusChange(l._id, st)}>
                                {st}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString() : "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveLead(l)} className="text-xs font-semibold text-indigo-600 hover:underline">
                          View Details
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

      {activeLead && (
        <EmployeeLeadDetailDrawer lead={activeLead} onClose={() => setActiveLead(null)} onRefresh={fetchLeads} />
      )}

      {openAdd && (
        <AddLeadModal onClose={() => setOpenAdd(false)} onSuccess={fetchLeads} />
      )}
    </AppLayout>
  );
}

function EmployeeLeadDetailDrawer({ lead, onClose, onRefresh }) {
  const api = useApi();
  const [notes, setNotes] = useState(lead.notes || "");
  const [nextFollowUp, setNextFollowUp] = useState(
    lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/leads/${lead._id}/notes`, {
        notes,
        nextFollowUp: nextFollowUp || null,
        lastContacted: new Date(),
      });
      toast.success("Notes & follow-up updated");
      onRefresh();
      onClose();
    } catch (error) {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg bg-background p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold">{lead.name}</h2>
              <p className="text-xs font-semibold text-indigo-600">{lead.company}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Service / Job</span>
              <span className="font-semibold text-foreground">{lead.service || "DGFT Advisory"}</span>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Source</span>
              <span className="font-semibold text-foreground">{lead.source || "Direct"}</span>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Phone</span>
              <a href={`tel:${lead.phone}`} className="font-semibold text-indigo-600 hover:underline">{lead.phone || "N/A"}</a>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email</span>
              <a href={`mailto:${lead.email}`} className="font-semibold text-indigo-600 hover:underline truncate block">{lead.email || "N/A"}</a>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-500" /> Next Follow-up Date
            </label>
            <input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold flex items-center gap-1.5">
              <StickyNote size={14} className="text-indigo-500" /> Follow-up Notes & Updates
            </label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add call notes, client feedback, or updates..."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Save Follow-up
          </button>
        </div>
      </div>
    </div>
  );
}
