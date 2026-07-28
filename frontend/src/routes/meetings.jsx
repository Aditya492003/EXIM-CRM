import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Video, Plus, Search, X, Calendar, Clock, Users,
  ChevronLeft, ChevronRight, Trash2, Link2, CheckCircle2,
  Building2, Loader2, Clock3, XCircle, UserCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { CompanySearchCombobox } from "@/components/crm/CompanySearchCombobox";

export const Route = createFileRoute("/meetings")({
  component: MeetingsPage,
});

const statusOptions = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];
const modeOptions = [
  "Virtual (Google Meet)",
  "Virtual (Zoom)",
  "Virtual (Teams)",
  "In-Person (Client Office)",
  "In-Person (Our Office)",
  "Phone Call",
];

const outcomeColors = {
  Done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Postponed: "bg-amber-100 text-amber-700 border-amber-200",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

const outcomeIcons = {
  Done: CheckCircle2,
  Postponed: Clock3,
  Cancelled: XCircle,
};

function MeetingsPage() {
  const api = useApi();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/meetings");
      const data = res.data?.data || [];

      if (data.length === 0) {
        setMeetings([]);
      } else {
        setMeetings(
          data.map((m) => ({
            id: m.code || m._id,
            _id: m._id,
            title: m.title,
            type: m.type || "Discovery Call",
            company: m.company || "",
            attendee: m.attendee || "",
            mode: m.mode || "Virtual (Google Meet)",
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : "",
            time: m.time || "10:00 AM",
            duration: m.duration || "30 min",
            status: m.status || "Scheduled",
            notes: m.notes || "",
            link: m.meetingLink || m.link || "",
            assignedToClerkId: m.assignedToClerkId || "",
            assignedToName: m.assignedToName || "",
            outcomeStatus: m.outcomeStatus || "",
            outcomeNotes: m.outcomeNotes || "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load meetings", err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleStatusChange = async (id, mongoId, newStatus) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    if (mongoId) {
      try {
        await api.patch(`/meetings/${mongoId}/status`, { status: newStatus });
        toast.success(`Meeting status updated to ${newStatus}`);
      } catch (err) {
        toast.error("Failed to update meeting status");
        fetchMeetings();
      }
    }
  };

  const handleDelete = async (meeting) => {
    if (!confirm(`Delete meeting "${meeting.title}"?`)) return;
    try {
      if (meeting._id) {
        await api.delete(`/meetings/${meeting._id}`);
      }
      setMeetings((prev) =>
        prev.filter(
          (m) => (m._id || m.id) !== (meeting._id || meeting.id)
        )
      );
      toast.success("Meeting deleted");
    } catch (err) {
      toast.error("Failed to delete meeting");
    }
  };

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          m.title.toLowerCase().includes(s) ||
          m.company.toLowerCase().includes(s) ||
          m.attendee.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [meetings, statusFilter, search]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Calendar & Schedule
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Client Meetings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule advisory sessions, virtual calls, and site visits.
            </p>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
          >
            <Plus size={14} /> Schedule Meeting
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, attendee…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none"
          >
            <option value="All">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Meetings Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Meeting Title</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Attendee</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Employee Outcome</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">
                        Loading scheduled meetings from MongoDB...
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const OutIcon = m.outcomeStatus
                      ? outcomeIcons[m.outcomeStatus]
                      : null;
                    return (
                      <tr
                        key={m._id || m.id}
                        className="group hover:bg-muted/40 transition"
                      >
                        <td className="px-4 py-3 font-semibold">{m.title}</td>
                        <td className="px-4 py-3 text-xs">{m.company}</td>
                        <td className="px-4 py-3 text-xs font-medium">
                          {m.attendee}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {m.date} {m.time} ({m.duration})
                        </td>
                        <td className="px-4 py-3 text-xs">{m.mode}</td>
                        <td className="px-4 py-3 text-xs">
                          {m.assignedToName ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                              <UserCheck size={11} />
                              {m.assignedToName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={m.status}
                            onChange={(e) =>
                              handleStatusChange(m.id, m._id, e.target.value)
                            }
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {m.outcomeStatus ? (
                            <div className="flex flex-col gap-1">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold w-fit",
                                  outcomeColors[m.outcomeStatus]
                                )}
                              >
                                {OutIcon && <OutIcon size={10} />}
                                {m.outcomeStatus}
                              </span>
                              {m.outcomeNotes && (
                                <span
                                  className="text-[11px] text-muted-foreground max-w-[180px] truncate"
                                  title={m.outcomeNotes}
                                >
                                  {m.outcomeNotes}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(m)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No meetings found. Click "Schedule Meeting" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openAdd && (
        <AddMeetingModal
          onClose={() => setOpenAdd(false)}
          onSuccess={(createdMeeting) => {
            setOpenAdd(false);
            if (createdMeeting) {
              const formattedMeeting = {
                id: createdMeeting.code || createdMeeting._id,
                _id: createdMeeting._id,
                title: createdMeeting.title,
                type: createdMeeting.type || "Discovery Call",
                company: createdMeeting.company || "",
                attendee: createdMeeting.attendee || "",
                mode: createdMeeting.mode || "Virtual (Google Meet)",
                date: createdMeeting.date ? new Date(createdMeeting.date).toISOString().slice(0, 10) : "",
                time: createdMeeting.time || "10:00 AM",
                duration: createdMeeting.duration || "30 min",
                status: createdMeeting.status || "Scheduled",
                notes: createdMeeting.notes || "",
                link: createdMeeting.meetingLink || createdMeeting.link || "",
                assignedToClerkId: createdMeeting.assignedToClerkId || "",
                assignedToName: createdMeeting.assignedToName || "",
                outcomeStatus: createdMeeting.outcomeStatus || "",
                outcomeNotes: createdMeeting.outcomeNotes || "",
              };
              setMeetings((prev) => [formattedMeeting, ...prev]);
            }
            fetchMeetings();
          }}
        />
      )}
    </AppLayout>
  );
}

function AddMeetingModal({ onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    attendee: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00 AM",
    duration: "30 min",
    mode: modeOptions[0],
    status: "Scheduled",
    notes: "",
    link: "",
    assignedToClerkId: "",
    assignedToName: "",
  });

  // Fetch employee list for assignment
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

  const handleAssignChange = (e) => {
    const selectedId = e.target.value;
    const selectedEmp = employees.find((emp) => emp.clerkUserId === selectedId);
    setFormData({
      ...formData,
      assignedToClerkId: selectedId,
      assignedToName: selectedEmp?.name || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post("/meetings", formData);
      toast.success("Meeting scheduled successfully");
      onSuccess?.(res.data?.data);
      onClose?.();
    } catch (err) {
      console.error("Schedule meeting error", err);
      toast.error(
        err.response?.data?.message || "Failed to schedule meeting"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Meeting Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. DGFT Advisory Session"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Company *
              </label>
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
              <label className="mb-1 block text-xs font-semibold">
                Attendee Name
              </label>
              <input
                value={formData.attendee}
                onChange={(e) =>
                  setFormData({ ...formData, attendee: e.target.value })
                }
                placeholder="e.g. Rajiv Menon"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Time
              </label>
              <input
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                placeholder="e.g. 10:00 AM"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Mode</label>
              <select
                value={formData.mode}
                onChange={(e) =>
                  setFormData({ ...formData, mode: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {modeOptions.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Duration
              </label>
              <input
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                placeholder="e.g. 1 hour"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Assign to Employee */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
              <UserCheck size={13} className="text-indigo-500" />
              Assign to Employee
            </label>
            <select
              value={formData.assignedToClerkId}
              onChange={handleAssignChange}
              disabled={loadingEmployees}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
            >
              <option value="">— Unassigned —</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp.clerkUserId || emp._id}>
                  {emp.name}
                  {emp.role ? ` · ${emp.role}` : ""}
                </option>
              ))}
            </select>
            {formData.assignedToName && (
              <p className="mt-1 text-[11px] text-indigo-600 font-medium">
                ✓ Will be visible to {formData.assignedToName} on their Employee Portal
              </p>
            )}
          </div>

          {/* Meeting Link */}
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Meeting Link
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              placeholder="https://meet.google.com/..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Notes / Instructions
              <span className="ml-1 font-normal text-muted-foreground">
                (visible to employee)
              </span>
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Instructions, agenda, or context for the employee…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
