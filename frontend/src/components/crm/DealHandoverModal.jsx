import { useState, useEffect } from "react";
import {
  X, CheckCircle2, AlertCircle, Briefcase, Building2, User, Phone, Mail,
  Calendar, FileText, CheckSquare, Square, Upload, Loader2, ShieldCheck,
  Send, Lock, Sparkles, Tag, ArrowRight, IndianRupee, Layers
} from "lucide-react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

export function DealHandoverModal({ deal, onClose, onSuccess }) {
  const api = useApi();
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || "Sales Advisor";

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [executionManagers, setExecutionManagers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Auto-filled Contact info from deal or linked lead/contact
  const [clientContact, setClientContact] = useState({
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  });

  // Default dates
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultEndStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split("T")[0];
  };

  // Handover Form Data with all 7 requested sections
  const [formData, setFormData] = useState({
    // 1. Deal Information
    dealName: deal?.name || "",
    service: deal?.service || "BIS / ISI Domestic Certification",
    value: deal?.value || 0,
    priority: deal?.priority || "High",

    // 2. Client Details
    companyName: deal?.company || "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",

    // 3. Scope Sold
    scopeSoldDescription: `• Application preparation & verification\n• Technical documentation and test report collation\n• Liaison & coordination with regulatory authority\n• Certification grant assistance & end-to-end follow up`,
    includedItems: [
      "Application preparation",
      "Documentation support",
      "Authority coordination / Liaison",
      "Audit & inspection assistance"
    ],
    selectedIncluded: [
      "Application preparation",
      "Documentation support",
      "Authority coordination / Liaison"
    ],
    notIncludedText: "• Testing laboratory charges\n• Official government statutory fees\n• Travel & accommodation expenses for onsite inspection",

    // 4. Client Requirements & Commitments — SALES INPUT
    clientRequirements: "",

    // 5. Commitments Made
    commitmentsMade: "",

    // 6. Special Instructions
    specialInstructions: "",

    // Documents Upload Checklist
    uploadedDocsChecklist: {
      productSpecification: false,
      clientQuotation: false,
      existingCertificates: false,
      technicalDocuments: false,
      other: false,
    },
    attachedFiles: [],

    // 7. Execution Assignment
    executionManager: "",
    startDate: todayStr,
    estimatedEndDate: defaultEndStr(),
  });

  // Fetch linked Lead / Contact if available to auto-fill Contact details
  useEffect(() => {
    const fetchLinkedContact = async () => {
      try {
        if (deal?.leadId) {
          const res = await api.get(`/leads/${deal.leadId}`);
          const lead = res.data?.data;
          if (lead) {
            setFormData(prev => ({
              ...prev,
              contactPerson: prev.contactPerson || lead.name || "",
              contactEmail: prev.contactEmail || lead.email || "",
              contactPhone: prev.contactPhone || lead.phone || "",
            }));
            return;
          }
        }
        if (deal?.contactId) {
          const res = await api.get(`/contacts/${deal.contactId}`);
          const contact = res.data?.data;
          if (contact) {
            setFormData(prev => ({
              ...prev,
              contactPerson: prev.contactPerson || contact.name || "",
              contactEmail: prev.contactEmail || contact.email || "",
              contactPhone: prev.contactPhone || contact.phone || "",
            }));
          }
        }
      } catch (err) {
        // Silent fallback
      }
    };

    fetchLinkedContact();
  }, [api, deal]);

  // Fetch real team members for Execution Manager (No dummy data!)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await api.get("/employees");
        const list = res.data?.data || [];
        setExecutionManagers(list);
      } catch (err) {
        console.error("Failed to load execution managers", err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [api]);

  const handleToggleIncluded = (item) => {
    setFormData(prev => {
      const exists = prev.selectedIncluded.includes(item);
      return {
        ...prev,
        selectedIncluded: exists
          ? prev.selectedIncluded.filter(i => i !== item)
          : [...prev.selectedIncluded, item]
      };
    });
  };

  const handleToggleDoc = (key) => {
    setFormData(prev => ({
      ...prev,
      uploadedDocsChecklist: {
        ...prev.uploadedDocsChecklist,
        [key]: !prev.uploadedDocsChecklist[key]
      }
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, ...files.map(f => f.name)]
      }));
      toast.success(`${files.length} document(s) staged for handover`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deal?._id && !deal?.id) {
      toast.error("Invalid deal ID");
      return;
    }

    const dealId = deal._id || deal.id;

    try {
      setSubmitting(true);

      const handoverPayload = {
        handoverData: {
          ...formData,
          handedOverAt: new Date().toISOString(),
          handedOverBy: currentUserName,
        }
      };

      await api.post(`/deals/${dealId}/handover`, handoverPayload);

      // Also set local storage marker as backup
      try {
        const handedOverDeals = JSON.parse(localStorage.getItem("exim_handed_over_deals") || "[]");
        if (!handedOverDeals.includes(dealId)) {
          handedOverDeals.push(dealId);
          localStorage.setItem("exim_handed_over_deals", JSON.stringify(handedOverDeals));
        }
      } catch (e) { }

      toast.success(`🎉 Deal "${deal.name}" successfully handed over to Execution Team! Status update locked.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Handover error:", err);
      toast.error(err.response?.data?.message || "Failed to handover deal to execution team");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto flex flex-col justify-between"
      >
        {/* Sticky Header with centered Deal Name */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck size={12} className="text-indigo-600" /> Formal Handover Form
            </span>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted cursor-pointer transition">
              <X size={18} />
            </button>
          </div>

          {/* Centered Heading */}
          <div className="text-center mt-2 pb-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl text-center">
              {deal?.name || "Deal Handover"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Sales Opportunity Handover & Execution Assignment to Operations Team
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. DEAL INFORMATION */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Briefcase size={15} /> 1. Deal Information.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Deal Title</label>
                <input
                  type="text"
                  readOnly
                  value={formData.dealName}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-bold text-foreground outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Trade Service</label>
                <input
                  type="text"
                  readOnly
                  value={formData.service}
                  className="w-full rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/30 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Deal Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">₹</span>
                  <input
                    type="text"
                    readOnly
                    value={formData.value ? Number(formData.value).toLocaleString("en-IN") : "0"}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30 pl-6 pr-3 py-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Priority</label>
                <input
                  type="text"
                  readOnly
                  value={formData.priority}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-bold text-foreground outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 2. CLIENT DETAILS */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Building2 size={15} /> 2. Client Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-foreground block mb-1">Company / Client Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Acme Global Exports Pvt Ltd"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="rajesh@acme.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* 3. SCOPE SOLD */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Layers size={15} /> 3. Scope Sold
              </div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">WHAT WAS SOLD?</span>
            </div>

            {/* Service Title */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Service</label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-indigo-400"
              />
            </div>

            {/* Scope (Multi-line text) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-foreground">Scope Deliverables (Multi-line Text)</label>
                <span className="text-[10px] text-muted-foreground">List out key deliverables</span>
              </div>
              <textarea
                rows={4}
                value={formData.scopeSoldDescription}
                onChange={(e) => setFormData({ ...formData, scopeSoldDescription: e.target.value })}
                placeholder="• BIS certification for XYZ product&#10;• Application preparation&#10;• Documentation support&#10;• Coordination with BIS&#10;• Certification assistance"
                className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-indigo-400 leading-relaxed"
              />
            </div>
          </div>

          {/* 4. CLIENT REQUIREMENTS & COMMITMENTS — SALES INPUT */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <FileText size={15} /> 4. Client Requirements & Commitments — SALES INPUT
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                What does the client specifically need?
              </label>
              <textarea
                rows={3}
                required
                value={formData.clientRequirements}
                onChange={(e) => setFormData({ ...formData, clientRequirements: e.target.value })}
                placeholder="Describe exact client requirement, specific target dates, compliance pain points, testing facility preferences..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* 5. COMMITMENTS MADE */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 size={15} /> 5. Commitments Made
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Specific commitments made by sales person
              </label>
              <textarea
                rows={3}
                value={formData.commitmentsMade}
                onChange={(e) => setFormData({ ...formData, commitmentsMade: e.target.value })}
                placeholder="e.g. Committed draft application review within 3 business days; guaranteed primary contact on WhatsApp for fast response..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* 6. SPECIAL INSTRUCTIONS & DOCUMENTS UPLOAD */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <FileText size={15} /> 6. Special Instructions & Documents Upload
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">
                Special Instructions.
              </label>
              <textarea
                rows={2}
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                placeholder="Any confidential clauses, client work hours, preferred communication mode, escalation matrix..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>

            {/* Documents Checklist & Upload */}
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3">
              <label className="text-xs font-bold text-foreground block">
                Documents Received from Client.
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[].map((doc) => {
                  const isChecked = formData.uploadedDocsChecklist[doc.key];
                  return (
                    <button
                      key={doc.key}
                      type="button"
                      onClick={() => handleToggleDoc(doc.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 text-xs transition cursor-pointer text-left",
                        isChecked
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {isChecked ? <CheckSquare size={13} className="text-indigo-600 shrink-0" /> : <Square size={13} className="shrink-0" />}
                      <span className="truncate">{doc.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Upload Dropzone */}
              <div className="mt-2 flex items-center justify-between rounded-xl border border-dashed border-border bg-background p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload size={14} className="text-indigo-500" />
                  <span>Attach client files / specifications (optional):</span>
                </div>
                <label className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer">
                  Browse Files
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {formData.attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.attachedFiles.map((fname, idx) => (
                    <span key={idx} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground flex items-center gap-1">
                      <FileText size={10} /> {fname}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 7. EXECUTION ASSIGNMENT */}
          <div className="rounded-2xl border-2 border-indigo-500/30 bg-indigo-50/30 dark:border-indigo-500/20 dark:bg-indigo-950/20 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-900 pb-2 text-xs font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-300">
              <User size={15} /> 7. Execution Assignment
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Execution Manager (Empty by default, no dummy names) */}
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  Select Execution Manager *
                </label>
                <select
                  required
                  value={formData.executionManager}
                  onChange={(e) => setFormData({ ...formData, executionManager: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400 cursor-pointer text-foreground"
                >
                  <option value="">-- Select Execution Manager --</option>
                  {executionManagers.map((emp) => (
                    <option key={emp._id || emp.name} value={emp.name}>
                      {emp.name} ({emp.role || emp.department || "Operations"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  Execution Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400"
                />
              </div>

              {/* Estimated End Date */}
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  Estimated End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.estimatedEndDate}
                  onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Handing Over...
                </>
              ) : (
                <>
                  <Send size={14} /> Send Handover to Execution Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
