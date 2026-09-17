import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, X, StickyNote, Loader2, RefreshCw, Briefcase, Plus, FileText, Send, ShieldCheck, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddDealModal, DealDetailDrawer, EditDealModal } from "@/routes/deals";
import { DealHandoverModal } from "@/components/crm/DealHandoverModal";

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
  const [editingDeal, setEditingDeal] = useState(null);
  const [handoverDeal, setHandoverDeal] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/deals?search=${search}`);
      const data = res.data.data || [];

      let localHanded = [];
      try {
        localHanded = JSON.parse(localStorage.getItem("exim_handed_over_deals") || "[]");
      } catch (e) {}

      setDeals(data.map(d => {
        const isHanded = d.isHandedOver || localHanded.includes(d._id) || d.handoverStatus === "Handed Over";
        return {
          id: d.code || d._id,
          _id: d._id,
          name: d.name,
          company: d.company || "",
          companyId: d.companyId,
          leadId: d.leadId,
          contactId: d.contactId,
          value: d.value || 0,
          stage: d.stage || "New",
          priority: d.priority || "Medium",
          owner: d.assignedTo || "You",
          assignedTo: d.assignedTo || "You",
          assignedToClerkId: d.assignedToClerkId,
          expectedClose: d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString("en-IN") : "",
          expectedCloseDate: d.expectedCloseDate,
          closedDate: d.closedDate,
          createdDate: d.createdDate ? new Date(d.createdDate).toLocaleDateString("en-IN") : "Recently",
          service: d.service || "DGFT Advisory",
          serviceId: d.serviceId,
          notes: d.notes || "",
          isHandedOver: isHanded,
          handoverStatus: isHanded ? "Handed Over" : (d.handoverStatus || ""),
          handoverData: d.handoverData || null,
          timeline: d.timeline || [],
          collaborators: d.collaborators || [],
        };
      }));
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
    const target = deals.find(d => d._id === id);
    if (target?.isHandedOver) {
      toast.error("This deal has been handed over to the Execution Team. Stage changes are locked.");
      return;
    }

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
            <button onClick={fetchDeals} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={13} /> Refresh
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search deals, company, service..."
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
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Deal</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Service / Job</th>
                  <th className="px-5 py-3.5">Value (₹)</th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5">Expected Close</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /></td></tr>
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground font-medium">No deals found in your portal.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Click "+ Add Deal" to create a new deal.</p>
                    </td>
                  </tr>
                ) : (
                  deals.map((d) => (
                    <tr key={d._id} className={cn("hover:bg-muted/30 transition", d.isHandedOver && "bg-emerald-50/10")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setActiveDeal(d)} className="font-bold hover:text-indigo-600 text-left cursor-pointer">
                            {d.name}
                          </button>
                          {d.isHandedOver && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <ShieldCheck size={10} /> Handed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-muted-foreground">{d.company || "Direct"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                          <Briefcase size={11} className="text-indigo-500" />
                          {d.service || "DGFT Advisory"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(d.value || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        {d.isHandedOver ? (
                          <div
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 cursor-not-allowed"
                            title="Handed over to Execution Team - Status changes are locked"
                          >
                            <Lock size={12} className="text-emerald-600" /> Handed Over
                          </div>
                        ) : (
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
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString("en-IN") : "Not set"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!d.isHandedOver ? (
                            <button
                              onClick={() => setHandoverDeal(d)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                              title="Handover to Execution"
                            >
                              <Send size={12} /> Handover
                            </button>
                          ) : (
                            <button
                              onClick={() => setHandoverDeal(d)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                              title="View Handover"
                            >
                              <ShieldCheck size={12} /> Handed
                            </button>
                          )}
                          <button
                            onClick={() => setActiveDeal(d)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            <FileText size={13} /> View
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

      {/* Rich View Deal Drawer */}
      {activeDeal && (
        <DealDetailDrawer
          deal={activeDeal}
          onClose={() => setActiveDeal(null)}
          onEdit={() => {
            const target = activeDeal;
            setActiveDeal(null);
            setEditingDeal(target);
          }}
          onHandover={() => {
            const target = activeDeal;
            setActiveDeal(null);
            setHandoverDeal(target);
          }}
          onDelete={() => {
            fetchDeals();
            setActiveDeal(null);
          }}
          onRefresh={fetchDeals}
        />
      )}

      {/* Deal Handover Modal */}
      {handoverDeal && (
        <DealHandoverModal
          deal={handoverDeal}
          onClose={() => setHandoverDeal(null)}
          onSuccess={() => {
            setHandoverDeal(null);
            fetchDeals();
          }}
        />
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <EditDealModal
          deal={editingDeal}
          onClose={() => setEditingDeal(null)}
          onSuccess={fetchDeals}
        />
      )}

      {/* Add Deal Modal */}
      {openAdd && (
        <AddDealModal onClose={() => setOpenAdd(false)} onSuccess={fetchDeals} />
      )}
    </AppLayout>
  );
}
