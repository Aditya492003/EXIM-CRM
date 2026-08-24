import { useState } from "react";
import {
  X, Briefcase, IndianRupee, Sparkles, Handshake, Loader2,
  Calendar, ShieldAlert, CheckCircle2, User, FileText, ArrowRight
} from "lucide-react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

const STAGES = ["New", "Qualified", "Proposal Sent", "Negotiation", "Won"];
const PRIORITIES = ["Low", "Medium", "High"];

const AMOUNT_PRESETS = [
  { label: "₹50K", value: 50000 },
  { label: "₹1L", value: 100000 },
  { label: "₹2.5L", value: 250000 },
  { label: "₹5L", value: 500000 },
  { label: "₹10L", value: 1000000 },
  { label: "₹25L", value: 2500000 },
];

export function ConvertLeadToDealModal({ lead, onClose, onSuccess }) {
  const api = useApi();
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || "Team Member";

  const defaultCloseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    name: `${lead?.company || lead?.name || "Client"} - ${lead?.service || "Deal"}`,
    value: 500000,
    stage: "New",
    priority: "Medium",
    expectedCloseDate: defaultCloseDate(),
    assignedTo: lead?.assignedTo && lead?.assignedTo !== "Nikhil Rao" ? lead?.assignedTo : currentUserName,
    notes: lead?.notes ? `Converted from Lead: ${lead.notes}` : `Lead "${lead?.name}" converted to deal opportunity.`,
  });

  const [submitting, setSubmitting] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [requestingCollab, setRequestingCollab] = useState(false);

  const handleSubmit = async (e, forceConvert = false) => {
    if (e) e.preventDefault();
    if (!lead?._id && !lead?.id) {
      toast.error("Invalid lead ID");
      return;
    }

    const leadId = lead._id || lead.id;

    try {
      setSubmitting(true);
      setDuplicateData(null);

      const payload = {
        ...formData,
        value: Number(formData.value) || 0,
        forceConvert,
      };

      const res = await api.post(`/leads/${leadId}/convert`, payload);
      toast.success(res.data?.message || "Lead successfully converted to Deal! 🎉");
      onSuccess?.(res.data?.data);
      onClose();
    } catch (err) {
      console.error("Convert lead error:", err);
      if (err.response?.data?.isDealDuplicate && err.response?.data?.existingDeal) {
        setDuplicateData(err.response.data.existingDeal);
      } else {
        toast.error(err.response?.data?.message || "Failed to convert lead to deal");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCollaboration = async () => {
    if (!duplicateData?._id) return;
    try {
      setRequestingCollab(true);
      const res = await api.post("/collaboration-requests", {
        entityType: "Deal",
        entityId: duplicateData._id,
        reason: "Requesting collaboration on existing deal opportunity for this company.",
      });
      toast.success(res.data?.message || `Collaboration request sent to ${duplicateData.ownerName}`);
      setDuplicateData(null);
      onClose();
    } catch (err) {
      console.error("Deal collaboration request error:", err);
      toast.error(err.response?.data?.message || "Failed to send collaboration request");
    } finally {
      setRequestingCollab(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Convert Lead to Deal</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Sparkles size={11} /> Convert Flow
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set deal amount & commercial terms to convert this lead into an active revenue deal.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted cursor-pointer transition">
            <X size={18} />
          </button>
        </div>

        {/* Lead Summary Info Card */}
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/20 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-indigo-950 dark:text-indigo-200">
            <span className="flex items-center gap-1.5">
              <User size={13} className="text-indigo-600 dark:text-indigo-400" />
              {lead?.name}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{lead?.company || "Direct Individual"}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-indigo-100/80 dark:border-indigo-900/40 text-[11px] text-muted-foreground">
            <div>
              <span className="block font-medium text-slate-500 dark:text-slate-400">Service</span>
              <span className="font-semibold text-foreground">{lead?.service || "DGFT Advisory"}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500 dark:text-slate-400">Phone</span>
              <span className="font-semibold text-foreground">{lead?.phone || "—"}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-semibold text-foreground truncate block">{lead?.email || "—"}</span>
            </div>
          </div>
        </div>

        {/* Duplicate Deal Warning Modal State */}
        {duplicateData ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 dark:border-amber-900/50 dark:bg-amber-950/40 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                  Active Deal Already Exists in Workspace!
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  An active deal for <strong>{duplicateData.company}</strong> ({duplicateData.service}) is already owned by <strong>{duplicateData.ownerName}</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3.5 text-xs space-y-1.5 border border-amber-200 shadow-sm">
              <div><strong>Deal Title:</strong> {duplicateData.name}</div>
              <div><strong>Deal Value:</strong> ₹{duplicateData.value?.toLocaleString("en-IN")}</div>
              <div><strong>Current Stage:</strong> <span className="font-semibold text-indigo-600">{duplicateData.stage}</span></div>
              <div className="pt-2 text-indigo-700 font-bold border-t border-amber-200/60 dark:text-indigo-300 flex items-center justify-between">
                <span>Owner:</span>
                <span>{duplicateData.ownerName} (Workspace: {duplicateData.managerName})</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => handleSubmit(null, true)}
                disabled={submitting}
                className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer disabled:opacity-50"
              >
                Create Deal Anyway
              </button>
              <button
                type="button"
                onClick={handleRequestCollaboration}
                disabled={requestingCollab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {requestingCollab ? <Loader2 size={14} className="animate-spin" /> : <Handshake size={14} />} Request Collaboration
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={(e) => handleSubmit(e, false)}>
            {/* Deal Amount (Value in ₹) - HIGHLIGHTED PRIMARY FIELD */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <IndianRupee size={15} className="text-emerald-600 dark:text-emerald-400" />
                  Deal Amount / Revenue (₹) *
                </label>
                {formData.value > 0 && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{Number(formData.value).toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  ₹
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  placeholder="Enter deal value in ₹ (e.g. 250000)"
                  className="w-full rounded-xl border border-emerald-300 bg-background py-2.5 pl-8 pr-3 text-base font-bold text-foreground outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-800 dark:focus:ring-emerald-950"
                />
              </div>

              {/* Quick Amount Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-muted-foreground mr-1">Quick Select:</span>
                {AMOUNT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, value: p.value })}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer border",
                      formData.value === p.value
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold">Deal Title / Opportunity Name *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Corp - DGFT Annual Advisory"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Stage and Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Deal Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Close Date & Assigned Owner */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold flex items-center gap-1">
                  <Calendar size={13} className="text-indigo-500" /> Expected Close Date
                </label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Deal Owner</label>
                <input
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Deal owner name"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Deal Notes */}
            <div>
              <label className="mb-1 block text-xs font-semibold flex items-center gap-1">
                <FileText size={13} className="text-indigo-500" /> Notes & Strategic Context
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Key deliverables, client scope, pricing notes…"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Converting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Convert to Deal
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
