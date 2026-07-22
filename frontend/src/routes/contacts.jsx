import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  UserCheck, Plus, Search, Filter, Mail, Phone, Building2, Trash2, Pencil, X,
  ArrowUpRight, Users, Briefcase, Download, Upload, CheckCircle2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { contactsData as initialContacts, companiesData } from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

const companyNames = companiesData.map((c) => c.name);

function ContactsPage() {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

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

  const handleAddContact = (newContact) => {
    setContacts((prev) => [newContact, ...prev]);
    setOpenAdd(false);
  };

  const handleUpdateContact = (updated) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditing(null);
  };

  const handleDeleteContact = (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Company", "Phone", "Email", "Designation", "Created Date"];
    const rows = filtered.map((c) => [c.id, c.name, c.company, c.phone, c.email, c.designation || "", c.createdDate]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Contacts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage key people, executives and decision makers across client companies.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted">
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition"
            >
              <Plus size={14} /> New Contact
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl", k.tone)} />
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

        {/* Filter and Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, email, phone, role…"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>

            {/* Company Filter Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Filter Company:</label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 font-medium"
              >
                <option value="All">All Companies ({contacts.length})</option>
                {companyNames.map((co) => (
                  <option key={co} value={co}>
                    {co}
                  </option>
                ))}
              </select>
            </div>

            {companyFilter !== "All" && (
              <button onClick={() => setCompanyFilter("All")} className="text-xs text-indigo-600 hover:underline">
                Clear Filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-md text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Contact Name</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Mobile No.</th>
                  <th className="px-4 py-3">Email ID</th>
                  <th className="px-4 py-3">Designation / Role</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={c.name} size="sm" />
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-muted-foreground shrink-0" />
                        <span>{c.company}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {c.designation || "Contact"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <a href={`tel:${c.phone}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600" title="Call">
                          <Phone size={14} />
                        </a>
                        <a href={`mailto:${c.email}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-600" title="Email">
                          <Mail size={14} />
                        </a>
                        <button onClick={() => setEditing(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteContact(c.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <Users size={24} className="mx-auto text-muted-foreground/60" />
                      <div className="mt-2 font-medium text-sm">No contacts found</div>
                      <div className="text-xs mt-1">Try adjusting search or company filter.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openAdd && <ContactModal onClose={() => setOpenAdd(false)} onSave={handleAddContact} />}
      {editing && <ContactModal contact={editing} onClose={() => setEditing(null)} onSave={handleUpdateContact} />}
    </AppLayout>
  );
}

function ContactModal({ contact, onClose, onSave }) {
  const [name, setName] = useState(contact?.name ?? "");
  const [company, setCompany] = useState(contact?.company ?? companyNames[0] ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "+91 ");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [designation, setDesignation] = useState(contact?.designation ?? "Export Manager");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: contact?.id ?? `CT-${Math.floor(100 + Math.random() * 900)}`,
      name,
      company,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@${company.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.com`,
      designation,
      createdDate: contact?.createdDate ?? new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">{contact ? "Edit Contact" : "New Contact"}</h2>
            <p className="text-xs text-muted-foreground">Store details of company representatives.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X size={16} /></button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold">Contact Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Company (Select Dropdown) *</label>
            <select
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {companyNames.map((co) => (
                <option key={co} value={co}>
                  {co}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Mobile No.</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 90000 12345"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email ID *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">Designation / Role</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Export Manager / Purchase Head"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md">
              {contact ? "Save Changes" : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
