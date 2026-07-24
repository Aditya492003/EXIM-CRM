import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Filter, Trash2, Pencil, Mail, Phone, UserCheck,
  Building2, Briefcase, Calendar, ShieldCheck, Loader2, Sparkles, X, User
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
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role / Designation</th>
                  <th className="px-4 py-3">Department</th>
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
                        <div>{emp.phone || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={emp.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
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
      {active && <EmployeeDetailDrawer employee={active} onClose={() => setActive(null)} onEdit={() => { setEditing(active); setActive(null); }} onDelete={() => handleDelete(active)} />}
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
    status: "Active",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/employees", form);
      toast.success("Employee added successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to add employee", err);
      toast.error(err.response?.data?.message || "Failed to add employee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">Add New Employee</h2>
            <p className="text-xs text-muted-foreground">Register an advisor or representative.</p>
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
              <label className="mb-1 block text-xs font-semibold">Role / Designation *</label>
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Senior Trade Advisor"
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
              {submitting && <Loader2 size={14} className="animate-spin" />} Create Employee
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

function EmployeeDetailDrawer({ employee, onClose, onEdit, onDelete }) {
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
            <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Department</div>
                <div className="mt-0.5 text-sm font-semibold text-indigo-600">{employee.department}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
                <div className="mt-1"><StatusPill status={employee.status} /></div>
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
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-between gap-2">
          <button onClick={onDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer">
            Delete Employee
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted cursor-pointer">Close</button>
            <button onClick={onEdit} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
