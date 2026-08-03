import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Filter, Trash2, Pencil, Mail, Phone, UserCheck,
  Building2, Briefcase, Calendar, ShieldCheck, Loader2, Sparkles, X, User, Bell, Send
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees")({
  component: EmployeesPage,
});

const DEPARTMENTS = [
  "Sales",
  "DGFT Advisory",
  "Customs",
  "Logistics",
  "Compliance",
  "Support",
  "Operations",
];

const STATUSES = ["Active", "Inactive", "On Leave"];

export default function EmployeesPage() {
  const api = useApi();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [active, setActive] = useState(null);
  const [notifying, setNotifying] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
      toast.error("Failed to load employee directory");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (emp) => {
    if (!confirm(`Are you sure you want to delete employee "${emp.name}"?`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success("Employee deleted successfully");
      setEmployees((prev) => prev.filter((e) => e._id !== emp._id));
      if (active?._id === emp._id) setActive(null);
    } catch (err) {
      console.error("Failed to delete employee", err);
      toast.error(err.response?.data?.message || "Failed to delete employee");
    }
  };

  const filtered = useMemo(() => {
    let out = employees;
    if (statusFilter !== "All") out = out.filter((e) => e.status === statusFilter);
    if (deptFilter !== "All") out = out.filter((e) => e.department === deptFilter);
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          e.email.toLowerCase().includes(s) ||
          (e.role && e.role.toLowerCase().includes(s)) ||
          (e.department && e.department.toLowerCase().includes(s)) ||
          (e.phone && e.phone.includes(s))
      );
    }
    return out;
  }, [employees, statusFilter, deptFilter, search]);

  const activeCount = useMemo(() => employees.filter((e) => e.status === "Active").length, [employees]);
  const salesCount = useMemo(() => employees.filter((e) => e.department === "Sales").length, [employees]);
  const uniqueDepts = useMemo(() => new Set(employees.map((e) => e.department)).size, [employees]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Organization & HR
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Employee Directory
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage advisors, sales representatives, and team members.
            </p>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus size={15} /> Add Employee
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Team Members" value={employees.length} icon={UserCheck} color="text-indigo-500" />
          <StatCard title="Active Advisors" value={activeCount} icon={ShieldCheck} color="text-emerald-500" />
          <StatCard title="Sales Representatives" value={salesCount} icon={Briefcase} color="text-blue-500" />
          <StatCard title="Departments" value={uniqueDepts} icon={Building2} color="text-violet-500" />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role, department, phone…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Role / Designation</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Work Load</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">Loading employees from database...</div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((emp) => (
                    <tr key={emp._id} className="group hover:bg-muted/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={emp.name} size="sm" />
                          <div>
                            <button
                              onClick={() => setActive(emp)}
                              className="font-semibold text-foreground hover:text-indigo-600 text-left cursor-pointer underline decoration-indigo-200"
                            >
                              {emp.name}
                            </button>
                            <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-xs text-foreground">{emp.role}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300" title="Assigned Leads">
                            {emp.leadsCount || 0} Leads
                          </span>
                          <span className="rounded-md bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-300" title="Assigned Deals">
                            {emp.dealsCount || 0} Deals
                          </span>
                          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300" title="Proposals">
                            {emp.proposalsCount || 0} Proposals
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>{emp.phone || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <StatusPill status={emp.status} />
                          {emp.workingStatus && (
                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                              <span className={cn("h-1.5 w-1.5 rounded-full inline-block", emp.workingStatus === "Available" ? "bg-emerald-500" : emp.workingStatus === "On Leave" ? "bg-amber-500" : "bg-blue-500")} />
                              {emp.workingStatus}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => setNotifying(emp)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                            title="Send Notification Note to Employee"
                          >
                            <Bell size={14} />
                          </button>
                          <button
                            onClick={() => setEditing(emp)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                            title="Edit Employee"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      <Sparkles size={24} className="mx-auto text-muted-foreground/60" />
                      <div className="mt-2 font-medium text-sm">No employees match criteria</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {openAdd && <AddEmployeeModal onClose={() => setOpenAdd(false)} onSuccess={fetchEmployees} />}

      {/* Edit Employee Modal */}
      {editing && <EditEmployeeModal employee={editing} onClose={() => setEditing(null)} onSuccess={fetchEmployees} />}

      {/* View Employee Detail Modal */}
      {active && <EmployeeDetailDrawer employee={active} onClose={() => setActive(null)} onEdit={() => { setEditing(active); setActive(null); }} onDelete={() => handleDelete(active)} onSendNote={() => { setNotifying(active); setActive(null); }} />}

      {/* Send Notification Note Modal */}
      {notifying && <SendNotificationModal employee={notifying} onClose={() => setNotifying(null)} />}
    </AppLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className={cn("rounded-xl bg-muted p-2", color)}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const isOk = status === "Active";
  const isLeave = status === "On Leave";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        isOk && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        isLeave && "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        !isOk && !isLeave && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOk && "bg-emerald-500",
          isLeave && "bg-amber-500",
          !isOk && !isLeave && "bg-slate-400"
        )}
      />
      {status}
    </span>
  );
}

function AddEmployeeModal({ onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Trade Consultant",
    department: "Sales",
    designation: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post("/employees/invite", form);
      toast.success(res.data?.message || "Invite sent successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to invite employee", err);
      toast.error(err.response?.data?.message || "Failed to invite employee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">Invite New Employee</h2>
            <p className="text-xs text-muted-foreground">Register an advisor or representative and send an invitation.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email Address *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="priya@eximadvisory.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Role *</label>
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Senior Trade Advisor"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Designation</label>
              <input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="e.g. Consultant"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />} Invite Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({ employee, onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    role: employee?.role || "",
    department: employee?.department || "Sales",
    status: employee?.status || "Active",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/employees/${employee._id}`, form);
      toast.success("Employee updated successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to update employee", err);
      toast.error(err.response?.data?.message || "Failed to update employee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={employee.name} size="sm" />
            <div>
              <h2 className="text-lg font-bold">Edit Employee</h2>
              <p className="text-xs text-muted-foreground">{employee.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email Address *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Role / Designation *</label>
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeDetailDrawer({ employee, onClose, onEdit, onDelete, onSendNote }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md bg-background p-6 shadow-2xl overflow-y-auto animate-slide-left flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={employee.name} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
                <div className="text-xs text-muted-foreground font-medium">{employee.role}</div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={18} /></button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Action Card: Send Note */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-purple-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-indigo-950 dark:text-indigo-200">Send Manager Note</div>
                  <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">Send quick instruction or task update (auto-deletes in 24h)</div>
                </div>
                <button
                  onClick={onSendNote}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  <Bell size={13} /> Send Note
                </button>
              </div>
            </div>

            {/* Workload Stats Card */}
            <div className="rounded-2xl border border-border p-4 bg-muted/20 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Workload Summary</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                  <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300">{employee.leadsCount || 0}</div>
                  <div className="text-[10px] font-semibold text-blue-600/80 dark:text-blue-400">Leads</div>
                </div>
                <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-2.5 dark:border-purple-900/40 dark:bg-purple-950/30">
                  <div className="text-lg font-extrabold text-purple-700 dark:text-purple-300">{employee.dealsCount || 0}</div>
                  <div className="text-[10px] font-semibold text-purple-600/80 dark:text-purple-400">Deals</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{employee.proposalsCount || 0}</div>
                  <div className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400">Proposals</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Department</div>
                <div className="mt-0.5 text-sm font-semibold text-indigo-600">{employee.department}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System Status</div>
                <div className="mt-1"><StatusPill status={employee.status} /></div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Working Status</div>
                <div className="mt-0.5 font-medium text-foreground">
                  {employee.workingStatus === "Available" && "🟢 Available"}
                  {employee.workingStatus === "Working on Leads" && "🟡 Working on Leads"}
                  {employee.workingStatus === "On Leave" && "🔴 On Leave"}
                  {!employee.workingStatus && "🟢 Available"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</div>
                <div className="mt-0.5 font-medium text-foreground">{employee.email}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</div>
                <div className="mt-0.5 font-medium text-foreground">{employee.phone || "Not provided"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Joined Date</div>
                <div className="mt-0.5 font-medium text-foreground">
                  {employee.joinedDate ? new Date(employee.joinedDate).toLocaleDateString("en-IN") : "Recently"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Login</div>
                <div className="mt-0.5 font-medium text-foreground">
                  {employee.lastLogin ? new Date(employee.lastLogin).toLocaleString("en-IN") : "Never logged in"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-between gap-2">
          <button onClick={onDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer">
            Delete Employee
          </button>
          <div className="flex gap-2">
            <button onClick={onSendNote} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 cursor-pointer flex items-center gap-1">
              <Bell size={13} /> Note
            </button>
            <button onClick={onEdit} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendNotificationModal({ employee, onClose }) {
  const { user } = useUser();
  const api = useApi();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const managerSenderName = user?.fullName || user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Manager";

  const presetNotes = [
    "📄 Send proposal to XYZ company",
    "⚡ Check the leads and follow up today",
    "📅 Schedule client meeting for DGFT Advisory",
    "🔥 High priority deal update required",
    "📞 Call client contact person immediately",
  ];

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!note.trim()) {
      toast.error("Please enter a note message");
      return;
    }
    try {
      setSending(true);
      const res = await api.post("/notifications", {
        employeeId: employee._id,
        employeeEmail: employee.email,
        note: note.trim(),
        senderName: managerSenderName,
      });
      if (res.data?.success) {
        toast.success(`Notification note sent to ${employee.name}!`);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send notification note");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold">Send Notification Note</h2>
              <p className="text-xs text-muted-foreground">Will appear in employee dashboard (auto-deletes in 24h)</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Target Employee Info */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
          <UserAvatar name={employee.name} size="sm" />
          <div>
            <div className="text-sm font-semibold">{employee.name}</div>
            <div className="text-xs text-muted-foreground">{employee.role} · {employee.department}</div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Quick Note Presets</div>
          <div className="flex flex-wrap gap-1.5">
            {presetNotes.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNote(preset)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-indigo-500 hover:text-indigo-600 transition cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Note Form */}
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Manager Note / Work Instruction</label>
            <textarea
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Send proposal to XYZ company, check assigned leads for today..."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-md cursor-pointer disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
