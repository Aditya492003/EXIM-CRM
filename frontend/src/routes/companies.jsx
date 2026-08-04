import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Building2, Download, Filter, Mail, Phone, Plus, Search, Upload, X,
  Pencil, Trash2, CheckCircle2, Loader2, Globe, FileText, ExternalLink,
  ShieldCheck, AlertCircle, FileSpreadsheet, Eye, AlertTriangle, Users
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { AddContactModal } from "./contacts";
import { AddLeadModal } from "./leads";
import { AddDealModal } from "./deals";
import { Handshake, Sparkles, Target, Send } from "lucide-react";

export const Route = createFileRoute("/companies")({
  component: CompaniesPage,
});

const industriesList = [
  "Textiles", "Electronics", "Pharmaceuticals", "Agriculture", "Automotive",
  "Chemicals", "Machinery", "Food & Beverage", "Metals", "Consumer Goods", "Services", "Other"
];



export default function CompaniesPage() {
  const api = useApi();
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [openAddLeadCompany, setOpenAddLeadCompany] = useState(null);
  const [openAddDealCompany, setOpenAddDealCompany] = useState(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/companies");
      const data = res.data?.data || [];

      setCompaniesList(
        data.map((c) => ({
          id: c.code || c._id,
          _id: c._id,
          name: c.name,
          industry: c.industry || "General",
          primaryContact: c.primaryContact || "",
          phone: c.phone || "",
          email: c.email || "",
          assignedManager: c.assignedManager || c.ownerManagerName || "Workspace Manager",
          activeDeals: c.activeDeals || 0,
          status: c.status || "Active",
          revenue: c.revenue || 0,
          gstin: c.gstin || "",
          pan: c.pan || "",
          website: c.website || "",
          address: c.address || "",
          notes: c.notes || "",
          createdDate: c.createdDate ? new Date(c.createdDate).toLocaleDateString("en-IN") : "",
        }))
      );
    } catch (err) {
      console.error("Failed to load companies", err);
      toast.error("Failed to load companies list");
      setCompaniesList([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDeleteCompany = async (company) => {
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) return;
    try {
      if (company._id) {
        await api.delete(`/companies/${company._id}`);
      }
      setCompaniesList((prev) => prev.filter((c) => (c._id || c.id) !== (company._id || company.id)));
      if (active && (active._id === company._id || active.id === company.id)) setActive(null);
      if (editing && (editing._id === company._id || editing.id === company.id)) setEditing(null);
      toast.success("Company deleted successfully");
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/companies/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "companies.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Exported companies to CSV");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const filtered = useMemo(() => {
    return companiesList.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (industryFilter !== "All" && c.industry !== industryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(s) ||
          c.phone.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.industry.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [companiesList, search, status, industryFilter]);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Shared Accounts Directory</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Companies & Clients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} of {companiesList.length} total shared companies across all team members · Single unified DB
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer">
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer hover:shadow-lg transition"
            >
              <Plus size={14} /> Add Company
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name, phone, or email…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none">
            <option value="All">All Industries</option>
            {industriesList.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Company List Table (Showing 3 Key Fields: Company Name, Phone, Email + Actions) */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                      <div className="mt-2 text-xs">Loading shared company database...</div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((c) => (
                    <tr key={c._id || c.id} className="group hover:bg-muted/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs dark:bg-indigo-500/10 dark:text-indigo-300">
                            {c.name ? c.name.substring(0, 2).toUpperCase() : "CO"}
                          </div>
                          <div>
                            <button
                              onClick={() => setActive(c)}
                              className="font-semibold text-foreground hover:text-indigo-600 text-left cursor-pointer underline decoration-indigo-200"
                            >
                              {c.name}
                            </button>
                            <div className="text-[11px] text-muted-foreground">
                              {c.industry} {c.primaryContact ? `· Contact: ${c.primaryContact}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 transition group-hover:opacity-100">
                          <button
                            onClick={() => setOpenAddLeadCompany(c.name)}
                            title="Make Lead for this Company"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            <Plus size={12} /> Lead
                          </button>
                          <button
                            onClick={() => setOpenAddDealCompany(c.name)}
                            title="Make Deal for this Company"
                            className="inline-flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-200 px-2 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100 transition cursor-pointer dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300"
                          >
                            <Handshake size={12} /> Deal
                          </button>
                          <button
                            onClick={() => setActive(c)}
                            title="View Detail Drawer"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setEditing(c)}
                            title="Edit Company"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(c)}
                            title="Delete Company"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      <Building2 size={24} className="mx-auto text-muted-foreground/60" />
                      <div className="mt-2 font-medium text-sm">No companies match criteria</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {active && (
        <CompanyDetailDrawer
          company={active}
          onClose={() => setActive(null)}
          onEdit={() => { setEditing(active); setActive(null); }}
          onDelete={() => handleDeleteCompany(active)}
          onMakeLead={(comp) => { setOpenAddLeadCompany(comp.name || comp); setActive(null); }}
          onMakeDeal={(comp) => { setOpenAddDealCompany(comp.name || comp); setActive(null); }}
        />
      )}

      {/* Make Lead Modal for Company */}
      {openAddLeadCompany && (
        <AddLeadModal
          defaultCompany={openAddLeadCompany}
          onClose={() => setOpenAddLeadCompany(null)}
          onSuccess={fetchCompanies}
        />
      )}

      {/* Make Deal Modal for Company */}
      {openAddDealCompany && (
        <AddDealModal
          defaultCompany={openAddDealCompany}
          onClose={() => setOpenAddDealCompany(null)}
          onSuccess={fetchCompanies}
        />
      )}

      {/* Add Company Modal (With Shared DB De-duplication Check) */}
      {openAdd && (
        <AddCompanyModal
          existingCompanies={companiesList}
          onClose={() => setOpenAdd(false)}
          onSuccess={fetchCompanies}
        />
      )}

      {/* Edit Company Modal (Full manual edit sections) */}
      {editing && <EditCompanyModal company={editing} onClose={() => setEditing(null)} onSuccess={fetchCompanies} />}
    </AppLayout>
  );
}

/* ── Company Detail Drawer (Just like Lead Detail Drawer) ────── */
function CompanyDetailDrawer({ company, onClose, onEdit, onDelete, onMakeLead, onMakeDeal }) {
  const api = useApi();
  const [tab, setTab] = useState("overview");
  const [companyContacts, setCompanyContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const fetchCompanyContacts = useCallback(async () => {
    if (!company) return;
    try {
      setLoadingContacts(true);
      const res = await api.get("/contacts", {
        params: { company: company.name, companyId: company._id }
      });
      setCompanyContacts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load company contacts", err);
    } finally {
      setLoadingContacts(false);
    }
  }, [api, company]);

  useEffect(() => {
    fetchCompanyContacts();
  }, [fetchCompanyContacts]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl bg-background p-6 shadow-2xl overflow-y-auto animate-slide-left flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-base shadow-md">
                {company.name ? company.name.substring(0, 2).toUpperCase() : "CO"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{company.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-indigo-600">{company.industry}</span>
                  <span className="text-xs text-muted-foreground">· Status: {company.status}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="rounded-lg p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer" title="Edit Company">
                <Pencil size={16} />
              </button>
              <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 cursor-pointer" title="Delete Company">
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted cursor-pointer"><X size={18} /></button>
            </div>
          </div>

          {/* Quick Creation & Business Actions Banner */}
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-violet-50/60 to-purple-50/80 p-3.5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-purple-950/40 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles size={13} /> Business Creation Actions for {company.name}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onMakeLead && onMakeLead(company)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
              >
                <Plus size={14} /> Make Lead
              </button>
              <button
                onClick={() => onMakeDeal && onMakeDeal(company)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition cursor-pointer"
              >
                <Handshake size={14} /> Make Deal
              </button>
              <button
                onClick={() => setShowAddContact(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
              >
                <Users size={14} /> Add Contact
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => company.phone && window.open(`tel:${company.phone}`)}
              disabled={!company.phone}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer disabled:opacity-40"
            >
              <Phone size={16} className="text-indigo-500" />
              <span>Call</span>
            </button>
            <button
              onClick={() => company.email && window.open(`mailto:${company.email}`)}
              disabled={!company.email}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer disabled:opacity-40"
            >
              <Mail size={16} className="text-indigo-500" />
              <span>Email</span>
            </button>
            <button
              onClick={() => company.website && window.open(company.website.startsWith("http") ? company.website : `https://${company.website}`, "_blank")}
              disabled={!company.website}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer disabled:opacity-40"
            >
              <Globe size={16} className="text-indigo-500" />
              <span>Website</span>
            </button>
            <button onClick={() => setTab("contacts")} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2.5 text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer">
              <Users size={16} className="text-indigo-500" />
              <span>Contacts ({companyContacts.length})</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border text-xs font-medium text-muted-foreground">
            {["overview", "contacts", "compliance", "deals", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 capitalize transition border-b-2 cursor-pointer flex items-center gap-1.5",
                  tab === t ? "border-indigo-600 font-bold text-indigo-600" : "border-transparent hover:text-foreground"
                )}
              >
                {t === "compliance" ? "Tax & Compliance" : t}
                {t === "contacts" && (
                  <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                    {companyContacts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "overview" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-muted/30">
                <InfoItem label="Company Name" value={company.name} highlight />
                <InfoItem label="Industry" value={company.industry} />
                <InfoItem label="Primary Contact" value={company.primaryContact || (companyContacts[0]?.name) || "Not assigned"} />
                <InfoItem label="Status" value={company.status} />
                <InfoItem label="Phone" value={company.phone || "Not provided"} />
                <InfoItem label="Email" value={company.email || "Not provided"} />
                <InfoItem label="Assigned Manager" value={company.assignedManager || company.ownerManagerName || "Workspace Manager"} />
                <InfoItem label="Created Date" value={company.createdDate || "Recently"} />
              </div>

              {/* Company Contacts Stack Preview */}
              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                    <Users size={14} className="text-indigo-500" /> Linked Contacts Stack ({companyContacts.length})
                  </div>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <Plus size={12} /> Add Contact
                  </button>
                </div>

                {companyContacts.length > 0 ? (
                  <div className="space-y-2">
                    {companyContacts.slice(0, 3).map((contact) => (
                      <div key={contact._id || contact.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={contact.name} size="xs" />
                          <div>
                            <div className="font-semibold text-xs text-foreground">{contact.name}</div>
                            <div className="text-[10px] text-muted-foreground">{contact.designation || "Key Contact"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {contact.phone && <a href={`tel:${contact.phone}`} className="text-muted-foreground hover:text-indigo-600"><Phone size={12} /></a>}
                          {contact.email && <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-indigo-600"><Mail size={12} /></a>}
                        </div>
                      </div>
                    ))}
                    {companyContacts.length > 3 && (
                      <button onClick={() => setTab("contacts")} className="w-full text-center text-[11px] font-medium text-indigo-600 hover:underline cursor-pointer pt-1">
                        View all {companyContacts.length} contacts →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-[11px] text-muted-foreground py-2">
                    No individual contacts added for this company yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "contacts" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-foreground">Company Contacts Stack ({companyContacts.length})</div>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <Plus size={13} /> Add Contact
                </button>
              </div>

              {loadingContacts ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                  <div className="mt-2 text-xs">Loading company contacts stack…</div>
                </div>
              ) : companyContacts.length > 0 ? (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {companyContacts.map((contact) => (
                    <div
                      key={contact._id || contact.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar name={contact.name} size="md" />
                        <div>
                          <div className="font-bold text-sm text-foreground">{contact.name}</div>
                          <div className="text-xs text-muted-foreground">{contact.designation || "Executive"}</div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                            {contact.phone && <span>📞 {contact.phone}</span>}
                            {contact.email && <span>✉️ {contact.email}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition"
                            title={`Call ${contact.phone}`}
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition"
                            title={`Email ${contact.email}`}
                          >
                            <Mail size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
                  <Users size={28} className="mx-auto text-muted-foreground/60" />
                  <div className="font-semibold text-sm text-foreground">No contacts linked to {company.name}</div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Key decision makers and personnel added for this company will stack here.
                  </p>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer mt-2"
                  >
                    <Plus size={14} /> Add First Contact
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "compliance" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30">
                <InfoItem label="GSTIN" value={company.gstin || "Not provided"} />
                <InfoItem label="PAN" value={company.pan || "Not provided"} />
                <InfoItem label="Address" value={company.address || "Not provided"} />
                <InfoItem label="Website URL" value={company.website || "Not provided"} />
              </div>
            </div>
          )}

          {tab === "deals" && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 bg-muted/30">
                <InfoItem label="Active Deals" value={company.activeDeals || 0} highlight />
                <InfoItem label="Est. Revenue" value={typeof company.revenue === "number" ? `₹${(company.revenue / 100000).toFixed(1)}L` : company.revenue || "₹0"} />
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border p-4 bg-muted/30 whitespace-pre-wrap">
                {company.notes || "No notes recorded yet for this company."}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted cursor-pointer">
            Close
          </button>
        </div>
      </div>

      {showAddContact && (
        <AddContactModal
          defaultCompany={company.name}
          defaultCompanyId={company._id}
          onClose={() => setShowAddContact(false)}
          onSuccess={() => {
            fetchCompanyContacts();
          }}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-xs font-medium", highlight && "text-indigo-600 font-bold")}>{value}</div>
    </div>
  );
}

/* ── Add Company Modal with Shared De-duplication Check & CSV Import Workflow ────── */
function AddCompanyModal({ existingCompanies = [], onClose, onSuccess }) {
  const api = useApi();
  const [tab, setTab] = useState("manual"); // 'manual' | 'import'
  const [submitting, setSubmitting] = useState(false);

  // Manual Form State
  const [formData, setFormData] = useState({
    name: "",
    industry: industriesList[0],
    primaryContact: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    gstin: "",
    pan: "",
    assignedManager: "",
    status: "Active",
    notes: "",
  });

  // Real-time Duplicate Match in Manual Mode
  const manualDuplicateMatch = useMemo(() => {
    if (!formData.name && !formData.email && !formData.phone && !formData.gstin) return null;

    const normName = formData.name.trim().toLowerCase();
    const normEmail = formData.email.trim().toLowerCase();
    const normPhone = formData.phone.trim();
    const normGstin = formData.gstin.trim().toUpperCase();

    return existingCompanies.find((c) => {
      if (normName && c.name.toLowerCase().trim() === normName) return true;
      if (normEmail && c.email && c.email.toLowerCase().trim() === normEmail) return true;
      if (normPhone && c.phone && c.phone.trim() === normPhone) return true;
      if (normGstin && c.gstin && c.gstin.toUpperCase().trim() === normGstin) return true;
      return false;
    });
  }, [formData, existingCompanies]);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [csvRows, setCsvRows] = useState([]); // parsed company records
  const [parsing, setParsing] = useState(false);

  // Global Duplicate State
  const [globalDuplicateData, setGlobalDuplicateData] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);

  const handleSendAccessRequest = async () => {
    if (!globalDuplicateData?._id) return;
    try {
      setRequestingAccess(true);
      const res = await api.post("/company-requests", {
        companyId: globalDuplicateData._id,
        reason: "Requesting access to existing company record for workspace collaboration.",
      });
      toast.success(res.data?.message || `Access request sent to Manager ${globalDuplicateData.ownerManagerName || ""}`);
      setGlobalDuplicateData(null);
      onClose();
    } catch (err) {
      console.error("Access request error:", err);
      toast.error(err.response?.data?.message || "Failed to send access request");
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualDuplicateMatch) {
      toast.error(`Company "${manualDuplicateMatch.name}" already exists in your workspace`);
      return;
    }

    try {
      setSubmitting(true);
      setGlobalDuplicateData(null);
      await api.post("/companies", formData);
      toast.success("Company created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create company error", err);
      if (err.response?.data?.isGlobalDuplicate && err.response?.data?.existingCompany) {
        setGlobalDuplicateData(err.response.data.existingCompany);
      } else {
        toast.error(err.response?.data?.message || "Failed to create company");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions for selecting single email and single phone if multiple exist in CSV cell
  const extractFirstEmail = (val) => {
    if (!val) return "";
    const parts = val.split(/[,;\/\s\n]+/);
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed.includes("@") && trimmed.includes(".")) {
        return trimmed;
      }
    }
    return parts[0]?.trim() || val.trim();
  };

  const extractFirstPhone = (val) => {
    if (!val) return "";
    const parts = val.split(/[,;\/\n]|\s+or\s+/i);
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed) return trimmed;
    }
    return val.trim();
  };

  // Parse CSV File & Check for DB Duplicates
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result || "";
        const { headers, rows } = parseCSVText(text);

        if (rows.length === 0) {
          toast.error("CSV file appears to be empty");
          setCsvRows([]);
          setParsing(false);
          return;
        }

        const colMap = mapHeaders(headers);

        // Pre-build index of existing companies for fast duplicate checks
        const existingNames = new Set(existingCompanies.map((c) => c.name.toLowerCase().trim()));
        const existingEmails = new Set(existingCompanies.filter((c) => c.email).map((c) => c.email.toLowerCase().trim()));
        const existingPhones = new Set(existingCompanies.filter((c) => c.phone).map((c) => c.phone.trim()));
        const existingGstins = new Set(existingCompanies.filter((c) => c.gstin).map((c) => c.gstin.toUpperCase().trim()));

        const batchNames = new Set();
        const batchEmails = new Set();
        const batchPhones = new Set();

        const records = rows
          .map((r, index) => {
            const rawName = (colMap.name !== undefined ? r[colMap.name] || "" : r[0] || "").trim();
            const rawEmail = extractFirstEmail(colMap.email !== undefined ? r[colMap.email] || "" : "");
            const rawPhone = extractFirstPhone(colMap.phone !== undefined ? r[colMap.phone] || "" : "");
            const rawIndustry = (colMap.industry !== undefined ? r[colMap.industry] || "" : "").trim();
            const rawContact = (colMap.primaryContact !== undefined ? r[colMap.primaryContact] || "" : "").trim();
            const rawWebsite = (colMap.website !== undefined ? r[colMap.website] || "" : "").trim();
            const rawAddress = (colMap.address !== undefined ? r[colMap.address] || "" : "").trim();
            const rawGstin = (colMap.gstin !== undefined ? r[colMap.gstin] || "" : "").trim();
            const rawPan = (colMap.pan !== undefined ? r[colMap.pan] || "" : "").trim();

            const normName = rawName.toLowerCase();
            const normEmail = rawEmail.toLowerCase();
            const normPhone = rawPhone;
            const normGstin = rawGstin.toUpperCase();

            // Duplicate Detection against shared DB + intra-batch
            const isDbDuplicate =
              (normName && existingNames.has(normName)) ||
              (normEmail && existingEmails.has(normEmail)) ||
              (normPhone && existingPhones.has(normPhone)) ||
              (normGstin && existingGstins.has(normGstin));

            const isBatchDuplicate =
              (normName && batchNames.has(normName)) ||
              (normEmail && batchEmails.has(normEmail)) ||
              (normPhone && batchPhones.has(normPhone));

            if (normName) batchNames.add(normName);
            if (normEmail) batchEmails.add(normEmail);
            if (normPhone) batchPhones.add(normPhone);

            return {
              tempId: index + 1,
              name: rawName,
              email: rawEmail,
              phone: rawPhone,
              industry: rawIndustry || "General",
              primaryContact: rawContact,
              website: rawWebsite,
              address: rawAddress,
              gstin: rawGstin,
              pan: rawPan,
              status: "Active",
              isDuplicate: isDbDuplicate || isBatchDuplicate,
              duplicateReason: isDbDuplicate
                ? "Already exists in shared database"
                : isBatchDuplicate
                ? "Duplicate entry in CSV file"
                : "",
            };
          })
          .filter((r) => r.name || r.email || r.phone);

        setCsvRows(records);
        const dupCount = records.filter((r) => r.isDuplicate).length;
        if (dupCount > 0) {
          toast.warning(`Parsed ${records.length} records. Found ${dupCount} duplicates already in DB.`);
        } else {
          toast.success(`Parsed ${records.length} new company records from CSV`);
        }
      } catch (err) {
        console.error("Error parsing CSV", err);
        toast.error("Failed to parse CSV file format");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleRowChange = (index, field, value) => {
    setCsvRows((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveRow = (index) => {
    setCsvRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkImport = async () => {
    // Only import non-duplicate valid rows
    const validNewRecords = csvRows.filter((r) => r.name.trim() && !r.isDuplicate);

    if (validNewRecords.length === 0) {
      toast.error("All rows are either duplicate or missing a company name.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/companies/bulk", { companies: validNewRecords });
      toast.success(res.data?.message || `Successfully imported ${validNewRecords.length} companies`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Bulk import failed", err);
      toast.error(err.response?.data?.message || "Bulk import failed");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      "Company Name,Email,Phone,Industry,Primary Contact,Website,Address,GSTIN,PAN\n" +
      "Apex Global Exim,info@apex.com, +91 98765 43210,Textiles,Rajesh Kumar,https://apex.com, Mumbai MH, 27AAAAA0000A1Z5, AAAAA0000A\n" +
      "Zenith Agro Pvt Ltd,contact@zenithagro.com, +91 91234 56789,Agriculture,Priya Patel,https://zenithagro.com, Pune MH, 27BBBBB1111B1Z2, BBBBB1111B\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies_sample_import.csv";
    a.click();
    a.remove();
  };

  const duplicateCount = useMemo(() => csvRows.filter((r) => r.isDuplicate).length, [csvRows]);
  const newCount = useMemo(() => csvRows.filter((r) => !r.isDuplicate && r.name).length, [csvRows]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">Add Company</h2>
            <p className="text-xs text-muted-foreground">Shared organization database · Duplicate prevention enabled</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        {/* Global Duplicate Detection Card */}
        {globalDuplicateData ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 dark:border-amber-900/50 dark:bg-amber-950/40 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                  Company Already Exists in Database!
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  Company "<strong>{globalDuplicateData.name}</strong>" is already registered under Manager <strong>{globalDuplicateData.ownerManagerName || "Workspace Manager"}</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3.5 text-xs space-y-1.5 border border-amber-200 shadow-sm">
              <div><strong>Company Name:</strong> {globalDuplicateData.name}</div>
              <div><strong>Industry:</strong> {globalDuplicateData.industry || "General"}</div>
              {globalDuplicateData.phone && <div><strong>Phone:</strong> {globalDuplicateData.phone}</div>}
              {globalDuplicateData.email && <div><strong>Email:</strong> {globalDuplicateData.email}</div>}
              <div className="pt-2 text-indigo-700 font-bold border-t border-amber-200/60 dark:text-indigo-300 flex items-center justify-between">
                <span>Created by Manager:</span>
                <span>{globalDuplicateData.ownerManagerName} ({globalDuplicateData.ownerManagerEmail || "N/A"})</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setGlobalDuplicateData(null)}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAccessRequest}
                disabled={requestingAccess}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {requestingAccess ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Request Access to {globalDuplicateData.name}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Headers */}
            <div className="mt-4 flex border-b border-border text-xs font-semibold">
              <button
                onClick={() => setTab("manual")}
                className={cn(
                  "px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2",
                  tab === "manual" ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 size={15} /> Manual Entry
              </button>
              <button
                onClick={() => setTab("import")}
                className={cn(
                  "px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2",
                  tab === "import" ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <FileSpreadsheet size={15} /> Import CSV Workflow
              </button>
            </div>

        {/* Tab 1: Manual Entry */}
        {tab === "manual" && (
          <form className="mt-4 space-y-4" onSubmit={handleManualSubmit}>
            {manualDuplicateMatch && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Similar Company Already Exists: </span>
                  "<span className="font-semibold">{manualDuplicateMatch.name}</span>" ({manualDuplicateMatch.email || manualDuplicateMatch.phone}).
                  <div className="mt-0.5 text-[11px] opacity-90">Company records are shared across all team members to avoid storage duplication.</div>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Company Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Global Ltd"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  {industriesList.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Phone *</label>
                <input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Email *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@apex.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Primary Contact</label>
                <input
                  value={formData.primaryContact}
                  onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Website</label>
                <input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://apex.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">GSTIN</label>
                <input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">PAN</label>
                <input
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  placeholder="AAAAA0000A"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Address</label>
              <input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full office address…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || Boolean(manualDuplicateMatch)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />} Create Company
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: CSV Import Workflow */}
        {tab === "import" && (
          <div className="mt-4 space-y-5">
            {/* CSV File Upload Dropzone */}
            <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center bg-muted/20 hover:bg-muted/40 transition">
              <Upload size={32} className="mx-auto text-indigo-500 mb-2" />
              <div className="text-sm font-bold text-foreground">Upload CSV File</div>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                File may contain Company Name, Email, Phone, Industry, Contact, Website, Address, GSTIN, PAN.
                Duplicates in the shared DB are automatically flagged & skipped to save storage.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <label className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 cursor-pointer transition">
                  <Upload size={14} /> Select CSV File
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  <Download size={14} /> Download Sample Template
                </button>
              </div>
              {csvFile && (
                <div className="mt-3 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 inline-block px-3 py-1 rounded-lg">
                  Loaded: {csvFile.name} ({csvRows.length} records parsed)
                </div>
              )}
            </div>

            {/* CSV Parsed Records Review & Edit Section */}
            {csvRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-3 rounded-xl border border-border">
                  <div className="text-xs font-bold">
                    Import Summary: <span className="text-emerald-600 font-extrabold">{newCount} New</span> · <span className="text-amber-600 font-extrabold">{duplicateCount} Existing Duplicates</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Duplicate rows will be automatically skipped to prevent database bloat.
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted text-left font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">DB Status</th>
                        <th className="px-3 py-2">Company Name *</th>
                        <th className="px-3 py-2">Phone *</th>
                        <th className="px-3 py-2">Email *</th>
                        <th className="px-3 py-2">Industry</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {csvRows.map((row, idx) => (
                        <tr
                          key={row.tempId || idx}
                          className={cn("transition", row.isDuplicate ? "bg-amber-50/40 dark:bg-amber-950/20" : "hover:bg-muted/40")}
                        >
                          <td className="p-2 whitespace-nowrap">
                            {row.isDuplicate ? (
                              <span title={row.duplicateReason} className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                                ⚠️ Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                                ✨ New
                              </span>
                            )}
                          </td>
                          <td className="p-1.5">
                            <input
                              value={row.name}
                              onChange={(e) => handleRowChange(idx, "name", e.target.value)}
                              placeholder="Required"
                              className={cn(
                                "w-full rounded-lg border bg-background px-2 py-1 outline-none",
                                !row.name ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-border"
                              )}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              value={row.phone}
                              onChange={(e) => handleRowChange(idx, "phone", e.target.value)}
                              placeholder="Phone"
                              className="w-full rounded-lg border border-border bg-background px-2 py-1 outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              value={row.email}
                              onChange={(e) => handleRowChange(idx, "email", e.target.value)}
                              placeholder="Email"
                              className="w-full rounded-lg border border-border bg-background px-2 py-1 outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              value={row.industry}
                              onChange={(e) => handleRowChange(idx, "industry", e.target.value)}
                              placeholder="Industry"
                              className="w-full rounded-lg border border-border bg-background px-2 py-1 outline-none"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <button
                              onClick={() => handleRemoveRow(idx)}
                              className="rounded-lg p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                              title="Remove row"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={submitting || newCount === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    Import {newCount} New Companies ({duplicateCount} skipped)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

/* ── Full Manual Edit Company Modal (With all extended edit sections) ── */
function EditCompanyModal({ company, onClose, onSuccess }) {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || "",
    industry: company?.industry || industriesList[0],
    primaryContact: company?.primaryContact || "",
    phone: company?.phone || "",
    email: company?.email || "",
    website: company?.website || "",
    address: company?.address || "",
    gstin: company?.gstin || "",
    pan: company?.pan || "",
    assignedManager: company?.assignedManager || "",
    status: company?.status || "Active",
    notes: company?.notes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/companies/${company._id}`, formData);
      toast.success("Company updated successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Update company error", err);
      toast.error(err.response?.data?.message || "Failed to update company");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
              {formData.name ? formData.name.substring(0, 2).toUpperCase() : "CO"}
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Company Details</h2>
              <p className="text-xs text-muted-foreground">{company.name} · ID: {company.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>

        <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
          {/* Section 1: Basic Details */}
          <section className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Basic Profile</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Company Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  {industriesList.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Primary Contact Person</label>
                <input
                  value={formData.primaryContact}
                  onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Assigned Account Manager</label>
                <EmployeeSelectDropdown
                  value={formData.assignedManager}
                  onChange={(val) => setFormData({ ...formData, assignedManager: val })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Phone Number</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Address & Website */}
          <section className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Address & Online Presence</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold">Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold">Office Address</label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, State, Country"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Tax & Compliance */}
          <section className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GST & Tax Registration</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">GSTIN</label>
                <input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 font-mono text-xs uppercase"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">PAN</label>
                <input
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  placeholder="AAAAA0000A"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Notes */}
          <section>
            <label className="mb-1 block text-xs font-semibold">Company Notes & Context</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes about this company…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </section>

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

// Custom CSV Text parser
function parseCSVText(text) {
  const lines = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cur.trim()) lines.push(cur);
      cur = "";
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else {
      cur += char;
    }
  }
  if (cur.trim()) lines.push(cur);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const cells = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (c === "," && !q) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);
  return { headers, rows };
}

// Map CSV headers to Company fields
function mapHeaders(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.includes("companyname") || clean === "company" || clean === "name") {
      map.name = idx;
    } else if (clean.includes("email")) {
      map.email = idx;
    } else if (clean.includes("phone") || clean.includes("mobile") || clean.includes("contactnumber") || clean === "contact") {
      map.phone = idx;
    } else if (clean.includes("industry")) {
      map.industry = idx;
    } else if (clean.includes("primarycontact") || clean.includes("contactperson") || clean.includes("primary")) {
      map.primaryContact = idx;
    } else if (clean.includes("website") || clean.includes("url")) {
      map.website = idx;
    } else if (clean.includes("address") || clean.includes("location")) {
      map.address = idx;
    } else if (clean.includes("gstin") || clean === "gst") {
      map.gstin = idx;
    } else if (clean.includes("pan")) {
      map.pan = idx;
    }
  });
  return map;
}

// Reusable Employee Select Dropdown (fetches from DB)
function EmployeeSelectDropdown({ value, onChange }) {
  const api = useApi();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    api.get("/employees").then(res => {
      setEmployees(res.data?.data || []);
    }).catch(() => {});
  }, [api]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400"
    >
      <option value="">— Unassigned —</option>
      {employees.map((e) => (
        <option key={e._id} value={e.name}>{e.name} ({e.role || e.department || "Employee"})</option>
      ))}
    </select>
  );
}
