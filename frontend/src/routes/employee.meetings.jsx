import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";
import {
  Video, Phone, MapPin, Calendar, Clock, Link2, Search,
  CheckCircle2, Clock3, XCircle, Loader2, RefreshCw,
  StickyNote, Building2, Users, ChevronDown, X,
  CalendarDays, AlertCircle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { AddMeetingModal } from "@/components/crm/AddMeetingModal";

export const Route = createFileRoute("/employee/meetings")({
  component: EmployeeMeetingsPage,
});

const outcomeOptions = ["Done", "Postponed", "Cancelled"];

const statusColors = {
  Scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  Rescheduled: "bg-amber-100 text-amber-700 border-amber-200",
};

const outcomeColors = {
  Done: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    glow: "shadow-emerald-100",
  },
  Postponed: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock3,
    dot: "bg-amber-500",
    glow: "shadow-amber-100",
  },
  Cancelled: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
    dot: "bg-rose-500",
    glow: "shadow-rose-100",
  },
};

function getModeIcon(mode) {
  if (!mode) return Video;
  if (mode.toLowerCase().includes("phone")) return Phone;
  if (mode.toLowerCase().includes("person")) return MapPin;
  return Video;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EmployeeMeetingsPage() {
  const api = useApi();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeOutcomeModal, setActiveOutcomeModal] = useState(null); // meeting object
  const [openAdd, setOpenAdd] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/meetings/employee");
      setMeetings(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load assigned meetings", err);
      toast.error("Failed to load assigned meetings");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const filtered = meetings.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(s) ||
      m.company?.toLowerCase().includes(s) ||
      m.attendee?.toLowerCase().includes(s)
    );
  });

  const upcoming = filtered.filter(
    (m) => !m.outcomeStatus && m.status !== "Cancelled"
  );
  const completed = filtered.filter((m) => m.outcomeStatus);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Assigned by Manager
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              My Meetings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View meetings assigned to you and update their outcome.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus size={14} /> Schedule Meeting
            </button>
            <button
              onClick={fetchMeetings}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, attendee…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
            <p className="text-sm text-muted-foreground">Loading your assigned meetings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Upcoming / Pending */}
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays size={14} className="text-indigo-500" />
                  Pending Outcome ({upcoming.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((m) => (
                    <MeetingCard
                      key={m._id}
                      meeting={m}
                      onUpdateOutcome={() => setActiveOutcomeModal(m)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed / Outcome Reported */}
            {completed.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Outcome Reported ({completed.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {completed.map((m) => (
                    <MeetingCard
                      key={m._id}
                      meeting={m}
                      onUpdateOutcome={() => setActiveOutcomeModal(m)}
                      dimmed
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Outcome Modal */}
      {activeOutcomeModal && (
        <OutcomeModal
          meeting={activeOutcomeModal}
          onClose={() => setActiveOutcomeModal(null)}
          onSuccess={() => {
            setActiveOutcomeModal(null);
            fetchMeetings();
          }}
          api={api}
        />
      )}

      {/* Schedule Meeting Modal */}
      {openAdd && (
        <AddMeetingModal
          onClose={() => setOpenAdd(false)}
          onSuccess={() => {
            setOpenAdd(false);
            fetchMeetings();
          }}
        />
      )}
    </AppLayout>
  );
}

function MeetingCard({ meeting: m, onUpdateOutcome, dimmed }) {
  const ModeIcon = getModeIcon(m.mode);
  const outcome = m.outcomeStatus ? outcomeColors[m.outcomeStatus] : null;
  const OutcomeIcon = outcome?.icon;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden",
        dimmed ? "opacity-75 hover:opacity-100" : "",
        outcome ? `shadow-sm ${outcome.glow}` : ""
      )}
    >
      {/* Card top accent */}
      <div
        className={cn(
          "h-1 w-full",
          m.status === "Cancelled"
            ? "bg-rose-400"
            : m.outcomeStatus === "Done"
            ? "bg-emerald-400"
            : m.outcomeStatus === "Postponed"
            ? "bg-amber-400"
            : m.outcomeStatus === "Cancelled"
            ? "bg-rose-400"
            : "bg-gradient-to-r from-indigo-400 to-violet-500"
        )}
      />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Title & Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-sm leading-tight">{m.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.type || "Meeting"}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                statusColors[m.status] || "bg-slate-100 text-slate-600 border-slate-200"
              )}
            >
              {m.status}
            </span>
            {m.outcomeStatus && (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  outcomeColors[m.outcomeStatus]?.badge
                )}
              >
                {OutcomeIcon && <OutcomeIcon size={10} />}
                {m.outcomeStatus}
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {m.company && (
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="shrink-0 text-indigo-400" />
              <span className="truncate font-medium text-foreground">{m.company}</span>
            </div>
          )}
          {m.attendee && (
            <div className="flex items-center gap-1.5">
              <Users size={12} className="shrink-0 text-violet-400" />
              <span className="truncate">{m.attendee}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="shrink-0 text-blue-400" />
            <span>{formatDate(m.date)}</span>
          </div>
          {m.time && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="shrink-0 text-slate-400" />
              <span>{m.time} {m.duration ? `· ${m.duration}` : ""}</span>
            </div>
          )}
          {m.mode && (
            <div className="flex items-center gap-1.5">
              <ModeIcon size={12} className="shrink-0 text-rose-400" />
              <span className="truncate">{m.mode}</span>
            </div>
          )}
          {m.link && (
            <div className="flex items-center gap-1.5">
              <Link2 size={12} className="shrink-0 text-emerald-500" />
              <a
                href={m.link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-indigo-600 hover:underline"
              >
                Join Meeting
              </a>
            </div>
          )}
        </div>

        {/* Manager Notes */}
        {m.notes && (
          <div className="rounded-xl bg-muted/50 border border-border px-3 py-2 text-xs">
            <div className="flex items-center gap-1 mb-1 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              <StickyNote size={10} /> Manager Notes
            </div>
            <p className="text-foreground/80 line-clamp-2">{m.notes}</p>
          </div>
        )}

        {/* Employee Outcome Notes */}
        {m.outcomeNotes && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 px-3 py-2 text-xs">
            <div className="flex items-center gap-1 mb-1 font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">
              <CheckCircle2 size={10} /> Your Notes
            </div>
            <p className="text-emerald-800 dark:text-emerald-200 line-clamp-2">{m.outcomeNotes}</p>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={onUpdateOutcome}
          className={cn(
            "w-full rounded-xl py-2 text-xs font-semibold transition-all duration-150",
            m.outcomeStatus
              ? "border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md hover:shadow-lg hover:from-indigo-600 hover:to-violet-700"
          )}
        >
          {m.outcomeStatus ? "Update Outcome" : "Report Outcome"}
        </button>
      </div>
    </div>
  );
}

function OutcomeModal({ meeting, onClose, onSuccess, api }) {
  const [outcomeStatus, setOutcomeStatus] = useState(meeting.outcomeStatus || "");
  const [outcomeNotes, setOutcomeNotes] = useState(meeting.outcomeNotes || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outcomeStatus) {
      toast.error("Please select an outcome status");
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/meetings/${meeting._id}/outcome`, {
        outcomeStatus,
        outcomeNotes,
      });
      toast.success(`Meeting outcome updated: ${outcomeStatus}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update outcome");
    } finally {
      setSubmitting(false);
    }
  };

  const OutIcon = outcomeStatus ? outcomeColors[outcomeStatus]?.icon : null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-background shadow-2xl border border-border overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Update Meeting Outcome</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
              {meeting.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meeting Summary */}
        <div className="bg-muted/20 border-b border-border px-5 py-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {meeting.company && (
            <div className="flex items-center gap-1.5">
              <Building2 size={11} className="text-indigo-400" />
              <span className="truncate font-medium text-foreground">{meeting.company}</span>
            </div>
          )}
          {meeting.attendee && (
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-violet-400" />
              <span className="truncate">{meeting.attendee}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-blue-400" />
            <span>{formatDate(meeting.date)}</span>
          </div>
          {meeting.time && (
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-slate-400" />
              <span>{meeting.time}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Outcome Status Selector */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Outcome Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {outcomeOptions.map((opt) => {
                const cfg = outcomeColors[opt];
                const Icon = cfg.icon;
                const selected = outcomeStatus === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOutcomeStatus(opt)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 text-xs font-semibold transition-all duration-150 cursor-pointer",
                      selected
                        ? `${cfg.badge} border-current shadow-sm`
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon
                      size={18}
                      className={selected ? "" : "text-muted-foreground"}
                    />
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notes / Reason
              <span className="ml-1 font-normal normal-case text-muted-foreground/60">
                (optional)
              </span>
            </label>
            <textarea
              rows={4}
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder={
                outcomeStatus === "Done"
                  ? "e.g. Meeting went well, client confirmed interest in the proposal…"
                  : outcomeStatus === "Postponed"
                  ? "e.g. Client requested to reschedule for next week due to travel…"
                  : outcomeStatus === "Cancelled"
                  ? "e.g. Client cancelled — no-show, will follow up…"
                  : "Add notes or reason for this outcome…"
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !outcomeStatus}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md transition-all cursor-pointer disabled:opacity-50",
                outcomeStatus === "Done"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : outcomeStatus === "Postponed"
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  : outcomeStatus === "Cancelled"
                  ? "bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600"
              )}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {OutIcon && !submitting && <OutIcon size={14} />}
              Save Outcome
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 mb-4">
        <CalendarDays className="h-8 w-8 text-indigo-400" />
      </div>
      <h3 className="text-base font-bold">No meetings assigned yet</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        Your manager will assign meetings to you from the Manager Portal. They will appear here.
      </p>
      <div className="mt-4 flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
        <AlertCircle size={12} />
        Check back later or contact your manager
      </div>
    </div>
  );
}
