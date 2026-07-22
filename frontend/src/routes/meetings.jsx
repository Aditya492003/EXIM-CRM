import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Video, Plus, Search, Filter, X, Calendar, Clock, Users, MapPin,
  ChevronLeft, ChevronRight, Pencil, Trash2, Phone, Link2, CheckCircle2,
  Building2, ArrowUpRight, MoreHorizontal, Bell,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meetings")({
  component: MeetingsPage,
});

/* ── helpers ───────────────────────────────────────── */
const seed = (n) => ((Math.sin(n) * 9301 + 49297) % 233280) / 233280;
const daysFromNow = (d) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};
const timeSlots = ["09:00", "10:00", "10:30", "11:00", "12:00", "13:30", "14:00", "15:00", "15:30", "16:00", "17:00"];
const durations = ["30 min", "45 min", "1 hour", "1.5 hours", "2 hours"];
const modes = ["Virtual (Google Meet)", "Virtual (Zoom)", "Virtual (Teams)", "In-Person (Client Office)", "In-Person (Our Office)", "Phone Call"];
const names = ["Rajiv Menon", "Priya Sharma", "Aditya Joshi", "Sunita Patel", "Kiran Malhotra", "Deepa Nair", "Vikram Singh", "Ananya Gupta"];
const companies = ["Tata Exports", "InfoSys Trade", "Bajaj Global", "HCL Logistics", "Mahindra EXIM", "Wipro Customs", "Reliance Trade", "ONGC Export", "Asian Paints", "Godrej Intl"];
const meetingTitles = ["DGFT Advisory Session", "Export License Review", "Customs Clearance Briefing", "Quarterly Business Review", "Trade Compliance Audit", "Capital Goods Consultation", "Export Benefit Discussion", "SEZ Registration Help", "Import Duty Advisory", "Annual Contract Review"];
const types = ["Discovery Call", "Follow-up", "Proposal Presentation", "QBR", "Demo", "Negotiation", "Closure"];
const statusOptions = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];

const initialMeetings = Array.from({ length: 22 }, (_, i) => ({
  id: `M-${500 + i}`,
  title: meetingTitles[i % meetingTitles.length],
  type: types[i % types.length],
  company: companies[i % companies.length],
  attendee: names[i % names.length],
  mode: modes[Math.floor(seed(i + 5) * modes.length)],
  date: daysFromNow(Math.floor(seed(i + 1) * 30) - 8),
  time: timeSlots[i % timeSlots.length],
  duration: durations[i % durations.length],
  status: i < 5 ? "Completed" : i === 5 ? "Cancelled" : "Scheduled",
  notes: i % 3 === 0 ? "Confirm agenda before meeting." : "",
  link: modes[Math.floor(seed(i + 5) * modes.length)].startsWith("Virtual") ? "https://meet.google.com/xyz-abc-123" : "",
}));

const STATUS_COLORS = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-800",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-800",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-800",
  Rescheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-800",
};

const TYPE_COLORS = {
  "Discovery Call": "from-indigo-500 to-blue-500",
  "Follow-up": "from-amber-500 to-orange-500",
  "Proposal Presentation": "from-violet-500 to-fuchsia-500",
  QBR: "from-cyan-500 to-teal-500",
  Demo: "from-emerald-500 to-green-500",
  Negotiation: "from-rose-500 to-pink-500",
  Closure: "from-green-500 to-emerald-600",
};

/* ── main page ─────────────────────────────────────── */
function MeetingsPage() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [active, setActive] = useState(null);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          m.title.toLowerCase().includes(s) ||
          m.company.toLowerCase().includes(s) ||
          m.attendee.toLowerCase().includes(s) ||
          m.type.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [meetings, statusFilter, search]);

  const upcomingCount = meetings.filter((m) => m.status === "Scheduled").length;
  const completedCount = meetings.filter((m) => m.status === "Completed").length;
  const todayCount = meetings.filter((m) => m.date === new Date().toISOString().slice(0, 10)).length;

  const handleSave = (m) => {
    if (m.id && meetings.some((x) => x.id === m.id)) {
      setMeetings((prev) => prev.map((x) => (x.id === m.id ? m : x)));
      setEditing(null);
    } else {
      const newM = { ...m, id: `M-${500 + meetings.length}` };
      setMeetings((prev) => [newM, ...prev]);
      setOpenAdd(false);
    }
  };

  const handleDelete = (id) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (active?.id === id) setActive(null);
  };

  const handleStatusChange = (id, status) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Scheduling</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Meetings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Schedule, track and manage all client meetings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition"
            >
              <Plus size={14} /> New Meeting
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[
            { label: "Total Meetings", value: meetings.length, icon: Calendar, tone: "from-indigo-500 to-violet-500" },
            { label: "Scheduled (Upcoming)", value: upcomingCount, icon: Clock, tone: "from-blue-500 to-cyan-500" },
            { label: "Today's Meetings", value: todayCount, icon: Bell, tone: "from-amber-500 to-orange-500" },
            { label: "Completed", value: completedCount, icon: CheckCircle2, tone: "from-emerald-500 to-teal-500" },
          ].map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm group hover:-translate-y-0.5 transition hover:shadow-lg">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl group-hover:opacity-40 transition", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 flex items-end justify-between">
                <div className="text-2xl font-bold tracking-tight">{k.value}</div>
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search meetings, companies, contacts…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["All", ...statusOptions].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    statusFilter === s
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Meetings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-md text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Meeting</th>
                  <th className="px-4 py-3">Company / Contact</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="group cursor-pointer hover:bg-muted/40 transition"
                    onClick={() => setActive(m)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", TYPE_COLORS[m.type] || "from-indigo-500 to-violet-500")}>
                          <Video size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate max-w-[180px]">{m.title}</div>
                          <div className="text-[11px] text-muted-foreground">{m.type} · {m.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground">{m.company}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Users size={10} /> {m.attendee}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-sm">{m.date}</div>
                      <div className="text-[11px] text-muted-foreground">{m.time} · {m.duration}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {m.mode.startsWith("Virtual") ? <Video size={12} /> : <MapPin size={12} />}
                        <span className="truncate max-w-[120px]">{m.mode}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusChange(m.id, e.target.value)}
                        className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold outline-none transition", STATUS_COLORS[m.status])}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        {m.link && (
                          <a href={m.link} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-600" title="Join Meeting">
                            <Link2 size={14} />
                          </a>
                        )}
                        <button onClick={() => setEditing(m)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <Calendar size={24} className="mx-auto text-muted-foreground/50" />
                      <div className="mt-2 font-medium text-sm">No meetings found</div>
                      <div className="text-xs mt-1">Try adjusting search or status filter.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Meeting Detail Drawer */}
      {active && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setActive(null)}>
          <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-background shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", TYPE_COLORS[active.type] || "from-indigo-500 to-violet-500")}>
                  <Video size={16} />
                </div>
                <div>
                  <div className="font-bold text-base">{active.title}</div>
                  <div className="text-xs text-muted-foreground">{active.type}</div>
                </div>
              </div>
              <button onClick={() => setActive(null)} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", STATUS_COLORS[active.status])}>
                {active.status}
              </span>
              <div className="space-y-3">
                {[
                  { icon: Building2, label: "Company", value: active.company },
                  { icon: Users, label: "Contact", value: active.attendee },
                  { icon: Calendar, label: "Date", value: active.date },
                  { icon: Clock, label: "Time & Duration", value: `${active.time} · ${active.duration}` },
                  { icon: MapPin, label: "Mode", value: active.mode },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                      <Icon size={13} />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
                      <div className="text-sm font-semibold mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
                {active.link && (
                  <a href={active.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                    <Link2 size={14} /> Join Meeting Link
                  </a>
                )}
                {active.notes && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 dark:bg-amber-500/10 dark:border-amber-500/20">
                    <div className="text-[11px] font-semibold uppercase text-amber-600 dark:text-amber-300">Notes</div>
                    <div className="mt-1 text-xs text-amber-800 dark:text-amber-200">{active.notes}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-auto border-t border-border p-4 flex gap-2">
              <button onClick={() => { setEditing(active); setActive(null); }} className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 py-2 text-xs font-semibold text-white">Edit Meeting</button>
              <button onClick={() => handleDelete(active.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {openAdd && <MeetingModal onClose={() => setOpenAdd(false)} onSave={handleSave} />}
      {editing && <MeetingModal meeting={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </AppLayout>
  );
}

/* ── Modal ─────────────────────────────────────────── */
function MeetingModal({ meeting, onClose, onSave }) {
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [type, setType] = useState(meeting?.type ?? types[0]);
  const [company, setCompany] = useState(meeting?.company ?? "");
  const [attendee, setAttendee] = useState(meeting?.attendee ?? "");
  const [date, setDate] = useState(meeting?.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(meeting?.time ?? "10:00");
  const [duration, setDuration] = useState(meeting?.duration ?? "1 hour");
  const [mode, setMode] = useState(meeting?.mode ?? modes[0]);
  const [link, setLink] = useState(meeting?.link ?? "");
  const [notes, setNotes] = useState(meeting?.notes ?? "");
  const [status, setStatus] = useState(meeting?.status ?? "Scheduled");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: meeting?.id, title, type, company, attendee, date, time, duration, mode, link, notes, status });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold">{meeting ? "Edit Meeting" : "New Meeting"}</h2>
            <p className="text-xs text-muted-foreground">Fill in meeting details below.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Meeting Title *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DGFT Advisory Session" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Meeting Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Company *</label>
              <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Tata Exports" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Contact / Attendee *</label>
              <input required value={attendee} onChange={(e) => setAttendee(e.target.value)} placeholder="e.g. Rajiv Menon" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Date *</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
                {durations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Meeting Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400">
              {modes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {mode.startsWith("Virtual") && (
            <div>
              <label className="mb-1 block text-xs font-semibold">Meeting Link</label>
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any agenda or pre-meeting notes…" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none" />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">
              {meeting ? "Save Changes" : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
