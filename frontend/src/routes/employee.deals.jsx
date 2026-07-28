import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, X, StickyNote, Loader2, RefreshCw, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/employee/deals")({
  component: EmployeeDealsPage,
});

const dealStages = ["New", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];

const stageColors = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  Qualified: "bg-violet-100 text-violet-700 border-violet-200",
  "Proposal Sent": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Negotiation: "bg-amber-100 text-amber-700 border-amber-200",
  Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Lost: "bg-rose-100 text-rose-700 border-rose-200",
};

function EmployeeDealsPage() {
  const api = useApi();
  const [deals, setDeals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState(null);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/deals?search=${search}`);
      setDeals(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleStageChange = async (id, stage) => {
    // Optimistic update
    setDeals(prev => prev.map(d => d._id === id ? { ...d, stage } : d));
    try {
      await api.patch(`/deals/${id}/stage`, { stage });
      toast.success(`Stage updated to "${stage}"`);
    } catch (error) {
      toast.error("Failed to update stage — please try again");
      fetchDeals(); // revert
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Deals</h1>
            <p className="text-sm text-muted-foreground">{deals.length} deals assigned to you</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchDeals} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search deals..."
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
                  <th className="px-5 py-3">Deal</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Expected Close</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No deals assigned to you yet.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Your manager will assign deals to you from the Manager Portal.</p>
                    </td>
                  </tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveDeal(d)} className="font-semibold text-indigo-600 hover:text-indigo-700 text-left">
                          {d.name}
                        </button>
                        {d.service && <div className="text-[11px] text-muted-foreground mt-0.5">{d.service}</div>}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{d.company || "—"}</td>
                      <td className="px-5 py-4 font-medium">
                        {d.value ? `₹${d.value.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold hover:opacity-80 focus:outline-none transition", stageColors[d.stage] || "border-slate-200 bg-slate-50 text-slate-700")}>
                              {d.stage} <ChevronDown size={11} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {dealStages.map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStageChange(d._id, s)}>
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveDeal(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" title="Notes">
                          <StickyNote size={14} />
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

      {activeDeal && (
        <DealNotesDrawer
          deal={activeDeal}
          onClose={() => setActiveDeal(null)}
          onSaved={() => { setActiveDeal(null); fetchDeals(); }}
          api={api}
        />
      )}
    </AppLayout>
  );
}

function DealNotesDrawer({ deal, onClose, onSaved, api }) {
  const [notes, setNotes] = useState(deal.notes || "");
  const [expectedClose, setExpectedClose] = useState(
    deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/deals/${deal._id}/notes`, { notes, expectedClose: expectedClose || null });
      toast.success("Deal notes saved!");
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
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-bold text-lg">{deal.name}</h2>
            <p className="text-xs text-muted-foreground">{deal.company} · {deal.stage}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="border-b border-border bg-muted/30 px-6 py-4 grid grid-cols-2 gap-3 text-xs">
          <div><div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Value</div>
            <span className="font-bold text-sm">{deal.value ? `₹${deal.value.toLocaleString("en-IN")}` : "—"}</span>
          </div>
          <div><div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Priority</div>
            <span className="font-medium">{deal.priority || "Medium"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Expected Close Date</label>
            <input
              type="date"
              value={expectedClose}
              onChange={(e) => setExpectedClose(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Notes & Progress Update</label>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record your progress, negotiation details, or next steps for this deal..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

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
