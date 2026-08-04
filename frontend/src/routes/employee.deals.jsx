import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, X, StickyNote, Loader2, RefreshCw, Briefcase, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddDealModal } from "@/routes/deals";

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
  const [openAdd, setOpenAdd] = useState(false);

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
    setDeals(prev => prev.map(d => d._id === id ? { ...d, stage } : d));
    try {
      await api.patch(`/deals/${id}/stage`, { stage });
      toast.success(`Stage updated to "${stage}"`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update stage — please try again");
      fetchDeals();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Deals</h1>
            <p className="text-sm text-muted-foreground">{deals.length} deals in your portal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} /> Add Deal
            </button>
            <button onClick={fetchDeals} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-64">
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
                  <tr><td colSpan="6" className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No deals found in your portal.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Click "+ Add Deal" to create a new deal.</p>
                    </td>
                  </tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d._id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveDeal(d)} className="font-semibold hover:text-indigo-600 text-left">
                          {d.name}
                        </button>
                      </td>
                      <td className="px-5 py-4 font-medium text-indigo-600">{d.company || "N/A"}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-600">₹{(d.value || 0).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border cursor-pointer", stageColors[d.stage] || "bg-muted text-muted-foreground")}>
                              {d.stage} <ChevronDown size={12} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {dealStages.map((st) => (
                              <DropdownMenuItem key={st} onClick={() => handleStageChange(d._id, st)}>
                                {st}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString() : "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setActiveDeal(d)} className="text-xs font-semibold text-indigo-600 hover:underline">
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

      {activeDeal && (
        <EmployeeDealDetailDrawer deal={activeDeal} onClose={() => setActiveDeal(null)} onRefresh={fetchDeals} />
      )}

      {openAdd && (
        <AddDealModal onClose={() => setOpenAdd(false)} onSuccess={fetchDeals} />
      )}
    </AppLayout>
  );
}

function EmployeeDealDetailDrawer({ deal, onClose, onRefresh }) {
  const api = useApi();
  const [notes, setNotes] = useState(deal.notes || "");
  const [expectedClose, setExpectedClose] = useState(
    deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/deals/${deal._id}/notes`, {
        notes,
        expectedClose: expectedClose || null,
      });
      toast.success("Notes & close date updated");
      onRefresh();
      onClose();
    } catch (error) {
      toast.error("Failed to save deal notes");
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
              <h2 className="text-lg font-bold">{deal.name}</h2>
              <p className="text-xs font-semibold text-indigo-600">{deal.company}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Deal Value</span>
              <span className="font-bold text-emerald-600 text-sm">₹{(deal.value || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Stage</span>
              <span className="font-semibold text-foreground">{deal.stage || "New"}</span>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Assigned Advisor</span>
              <span className="font-semibold text-foreground">{deal.assignedTo || "You"}</span>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Service</span>
              <span className="font-semibold text-foreground">{deal.service || "DGFT Service"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold">Expected Close Date</label>
            <input
              type="date"
              value={expectedClose}
              onChange={(e) => setExpectedClose(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold flex items-center gap-1.5">
              <StickyNote size={14} className="text-indigo-500" /> Deal Notes & Strategy
            </label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add client meeting summary, negotiation notes, or next steps..."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Save Deal
          </button>
        </div>
      </div>
    </div>
  );
}
