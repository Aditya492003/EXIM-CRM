import { useState, useEffect, useMemo } from "react";
import {
  X, Calendar, Clock, Video, UserCheck, Loader2, Building2, User,
  Phone, Mail, Search, Check, Sparkles, CheckCircle2, ChevronDown
} from "lucide-react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { CompanySearchCombobox } from "@/components/crm/CompanySearchCombobox";

const modeOptions = [
  "Virtual (Google Meet)",
  "Virtual (Zoom)",
  "Virtual (Teams)",
  "In-Person (Client Office)",
  "In-Person (Our Office)",
  "Phone Call",
];

const durationPresets = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours"];

export function AddMeetingModal({ defaultLead = null, defaultCompany = "", onClose, onSuccess }) {
  const api = useApi();
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || "Myself";
  const currentUserId = user?.id || "";

  const [scheduleTarget, setScheduleTarget] = useState(defaultLead ? "lead" : "company");
  const [submitting, setSubmitting] = useState(false);

  // Employee list for assignment
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Leads list for lead selection
  const [leadsList, setLeadsList] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(defaultLead);
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: defaultLead
      ? `Meeting with ${defaultLead.name} (${defaultLead.company || defaultLead.service || "Lead"})`
      : defaultCompany
      ? `Meeting with ${defaultCompany}`
      : "",
    company: defaultLead?.company || defaultCompany || "",
    companyId: defaultLead?.companyId || undefined,
    attendee: defaultLead?.name || "",
    contactId: defaultLead?.contactId || undefined,
    leadId: defaultLead?._id || defaultLead?.id || undefined,
    date: new Date().toISOString().slice(0, 10),
    time: "10:00 AM",
    duration: "30 min",
    mode: modeOptions[0],
    status: "Scheduled",
    notes: defaultLead?.notes ? `Context from lead: ${defaultLead.notes}` : "",
    link: "",
    assignedToClerkId: currentUserId,
    assignedToName: currentUserName,
  });

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await api.get("/employees");
        setEmployees(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load employees", err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [api]);

  // Fetch leads for lead selector
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoadingLeads(true);
        const res = await api.get("/leads?limit=100");
        setLeadsList(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load leads list for meeting modal", err);
      } finally {
        setLoadingLeads(false);
      }
    };
    fetchLeads();
  }, [api]);

  // Filter leads based on user query
  const filteredLeads = useMemo(() => {
    if (!leadSearch) return leadsList;
    const q = leadSearch.toLowerCase().trim();
    return leadsList.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.service?.toLowerCase().includes(q)
    );
  }, [leadsList, leadSearch]);

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setFormData((prev) => ({
      ...prev,
      title: `Meeting with ${lead.name} (${lead.company || lead.service || "Lead"})`,
      company: lead.company || "",
      companyId: lead.companyId || undefined,
      attendee: lead.name || "",
      contactId: lead.contactId || undefined,
      leadId: lead._id,
      notes: lead.notes ? `Lead Context: ${lead.notes}` : prev.notes,
    }));
    setLeadDropdownOpen(false);
  };

  const handleAssignChange = (e) => {
    const val = e.target.value;
    if (val === "self") {
      setFormData((prev) => ({
        ...prev,
        assignedToClerkId: currentUserId,
        assignedToName: currentUserName,
      }));
    } else if (val === "") {
      setFormData((prev) => ({
        ...prev,
        assignedToClerkId: "",
        assignedToName: "",
      }));
    } else {
      const selectedEmp = employees.find((emp) => (emp.clerkUserId || emp._id) === val);
      setFormData((prev) => ({
        ...prev,
        assignedToClerkId: selectedEmp?.clerkUserId || selectedEmp?._id || val,
        assignedToName: selectedEmp?.name || "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/meetings", formData);
      toast.success("Meeting scheduled successfully! 🎉");
      onSuccess?.(res.data?.data);
      onClose?.();
    } catch (err) {
      console.error("Schedule meeting error:", err);
      toast.error(err.response?.data?.message || "Failed to schedule meeting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Schedule Meeting</h2>
              <p className="text-xs text-muted-foreground">
                Set up a call or in-person advisory session with automated team sync.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Schedule Target Switcher (Company vs Lead) */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/40 p-1.5 border border-border">
          <button
            type="button"
            onClick={() => setScheduleTarget("lead")}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition cursor-pointer",
              scheduleTarget === "lead"
                ? "bg-background text-indigo-600 shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User size={14} className={scheduleTarget === "lead" ? "text-indigo-500" : ""} />
            Schedule for Lead
          </button>
          <button
            type="button"
            onClick={() => setScheduleTarget("company")}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition cursor-pointer",
              scheduleTarget === "company"
                ? "bg-background text-indigo-600 shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 size={14} className={scheduleTarget === "company" ? "text-indigo-500" : ""} />
            Schedule for Company
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {/* Target: Lead Selector */}
          {scheduleTarget === "lead" && (
            <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/20">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Select Lead *
              </label>

              {/* Lead Combobox / Scrollable Dropdown */}
              <div className="relative">
                <div
                  onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-background px-3 py-2.5 text-sm cursor-pointer shadow-xs dark:border-indigo-800 hover:border-indigo-400 transition"
                >
                  {selectedLead ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold text-foreground truncate">{selectedLead.name}</span>
                      <span className="text-xs text-indigo-600 truncate">
                        ({selectedLead.company || "No Company"})
                      </span>
                      {selectedLead.service && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                          {selectedLead.service}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Click to choose a lead from the scrollable list…
                    </span>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                </div>

                {leadDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setLeadDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-2xl animate-fade-in space-y-1">
                      {/* Search in Dropdown */}
                      <div className="sticky top-0 bg-card p-1 pb-2 border-b border-border z-10">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            type="text"
                            autoFocus
                            value={leadSearch}
                            onChange={(e) => setLeadSearch(e.target.value)}
                            placeholder="Type to filter leads by name, company, phone…"
                            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      {loadingLeads ? (
                        <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 size={14} className="animate-spin text-indigo-500" />
                          Loading leads…
                        </div>
                      ) : filteredLeads.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No leads found matching "{leadSearch}"
                        </div>
                      ) : (
                        filteredLeads.map((lead) => {
                          const isSelected = selectedLead?._id === lead._id;
                          return (
                            <button
                              key={lead._id}
                              type="button"
                              onClick={() => handleSelectLead(lead)}
                              className={cn(
                                "flex w-full flex-col rounded-lg px-3 py-2 text-xs text-left transition cursor-pointer gap-1",
                                isSelected
                                  ? "bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800"
                                  : "hover:bg-muted"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 font-bold text-foreground">
                                  <User size={13} className="text-indigo-500 shrink-0" />
                                  <span>{lead.name}</span>
                                  {lead.company && (
                                    <span className="text-indigo-600 font-semibold text-xs">
                                      · {lead.company}
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check size={14} className="text-indigo-600 font-bold" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 pl-5 text-[11px] text-muted-foreground">
                                {lead.service && (
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    💼 {lead.service}
                                  </span>
                                )}
                                {lead.phone && <span>📞 {lead.phone}</span>}
                                {lead.email && <span>✉️ {lead.email}</span>}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Auto-filled details reminder */}
              {selectedLead && (
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="font-medium text-muted-foreground block text-[10px] uppercase">
                      Company Auto-Linked
                    </span>
                    <span className="font-bold text-foreground">
                      {formData.company || "Direct Individual"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground block text-[10px] uppercase">
                      Contact Person Attendee
                    </span>
                    <span className="font-bold text-foreground">
                      {formData.attendee || selectedLead.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target: Company Combobox */}
          {scheduleTarget === "company" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Company *</label>
                <CompanySearchCombobox
                  required
                  value={formData.company}
                  onChange={(companyName) =>
                    setFormData((prev) => ({ ...prev, company: companyName }))
                  }
                  onSelectCompany={(selectedComp) => {
                    setFormData((prev) => ({
                      ...prev,
                      company: selectedComp.name,
                      companyId: selectedComp._id,
                      attendee: prev.attendee || selectedComp.primaryContact || "",
                    }));
                  }}
                  placeholder="Search or type company…"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Attendee / Contact</label>
                <input
                  value={formData.attendee}
                  onChange={(e) => setFormData({ ...formData, attendee: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          )}

          {/* Meeting Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold">Meeting Title *</label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. DGFT Annual Advisory Call"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold flex items-center gap-1">
                <Calendar size={13} className="text-indigo-500" /> Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold flex items-center gap-1">
                <Clock size={13} className="text-indigo-500" /> Time *
              </label>
              <input
                type="text"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="e.g. 10:00 AM"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Mode and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Meeting Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
              >
                {modeOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Duration</label>
              <div className="space-y-1">
                <input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 30 min"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
                <div className="flex flex-wrap gap-1">
                  {durationPresets.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration: dur })}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium border cursor-pointer transition",
                        formData.duration === dur
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      )}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assign to Employee / Own Assignment Selection */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <UserCheck size={14} className="text-indigo-500" />
              Assign Meeting Host / Advisor *
            </label>
            <select
              value={formData.assignedToClerkId === currentUserId ? "self" : formData.assignedToClerkId}
              onChange={handleAssignChange}
              disabled={loadingEmployees}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="self">
                👤 Assign to Myself ({currentUserName})
              </option>
              <optgroup label="Team Employees">
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.clerkUserId || emp._id}>
                    {emp.name} ({emp.role || emp.department || "Advisor"})
                  </option>
                ))}
              </optgroup>
              <option value="">— Unassigned —</option>
            </select>
            {formData.assignedToName && (
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                ✓ Host: <strong>{formData.assignedToName}</strong> (will be visible on their portal)
              </p>
            )}
          </div>

          {/* Meeting Link */}
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Meeting Video Link <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          {/* Notes / Agenda */}
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Agenda & Notes <span className="text-muted-foreground font-normal">(instructions)</span>
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Key meeting objectives, discussion agenda, or background notes…"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Scheduling…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Schedule Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
