import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  UserCheck, Plus, Search, Filter, Mail, Phone, Building2, Trash2, Pencil, X,
  ArrowUpRight, Users, Briefcase, Download, Upload, CheckCircle2, Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { contactsData as initialContacts, companiesData } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

const companyNames = companiesData.map((c) => c.name);

function ContactsPage() {
  const api = useApi();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/contacts");
      const data = res.data?.data || [];

      setContacts(data.map(c => ({
        id: c.code || c._id,
        _id: c._id,
        name: c.name,
        company: c.company || "",
        phone: c.phone || "",
        email: c.email || "",
        designation: c.designation || "",
        createdDate: c.createdDate ? new Date(c.createdDate).toLocaleDateString("en-IN") : ""
      })));
    } catch (err) {
      console.error("Failed to load contacts", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDeleteContact = async (contact) => {
    if (!confirm(`Delete contact "${contact.name}"?`)) return;
    try {
      if (contact._id) {
        await api.delete(`/contacts/${contact._id}`);
      }
      setContacts(prev => prev.filter(c => (c._id || c.id) !== (contact._id || contact.id)));
      toast.success("Contact deleted");
    } catch (err) {
      toast.error("Failed to delete contact");
    }
  };

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (companyFilter !== "All" && c.company !== companyFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(s) ||
          c.company.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.phone.includes(s) ||
          (c.designation && c.designation.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [contacts, companyFilter, search]);

  const kpis = [
    { label: "Total People Contacts", value: contacts.length, icon: Users, tone: "from-indigo-500 to-violet-500" },
    { label: "Companies Represented", value: new Set(contacts.map((c) => c.company)).size, icon: Building2, tone: "from-emerald-500 to-teal-500" },
    { label: "Active Decision Makers", value: Math.floor(contacts.length * 0.75), icon: UserCheck, tone: "from-blue-500 to-cyan-500" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Directory</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Individual Contacts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage client key personnel, designations, and contact numbers.
            </p>
          </div>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.tone)} />
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", k.tone)}>
                <k.icon size={16} />
              </div>
              <div className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold tracking-tight">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, designation, email…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Contact Name</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">Loading contacts from MongoDB...</div>
                    </td>
                  </tr>
                ) : filtered.map((c) => (
                  <tr key={c._id || c.id} className="group hover:bg-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={c.name} size="sm" />
                        <div className="font-semibold text-foreground">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.designation || "Executive"}</td>
                    <td className="px-4 py-3 text-xs font-medium">{c.company}</td>
                    <td className="px-4 py-3 text-xs">{c.phone}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteContact(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openAdd && <AddContactModal onClose={() => setOpenAdd(false)} onSuccess={fetchContacts} />}
    </AppLayout>
  );
}

function AddContactModal({ onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    designation: "",
    phone: "",
    email: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/contacts", formData);
      toast.success("Contact created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create contact error", err);
      toast.error(err.response?.data?.message || "Failed to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold">Add New Contact</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Full Name *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ramesh Shah" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Company *</label>
            <input required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="e.g. Acme Industries" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Designation</label>
              <input value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Import Manager" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Phone</label>
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Email *</label>
            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="ramesh@acme.com" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />} Create Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
