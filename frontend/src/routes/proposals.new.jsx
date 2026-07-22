import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  IndianRupee,
  LayoutTemplate,
  Save,
  Search,
  Sparkles,
  Shield,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { companiesData, proposalTemplates } from "@/data/dummy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/proposals/new")({
  component: NewProposalPage,
});

const steps = [
  { id: "client", label: "Client", icon: Building2 },
  { id: "service", label: "Service", icon: FileText },
  { id: "commercial", label: "Commercial", icon: IndianRupee },
  { id: "template", label: "Template", icon: LayoutTemplate },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "approve", label: "Approve", icon: Shield },
  { id: "generate", label: "Generate", icon: Download },
];

const services = [
  "DGFT · Advance Authorization",
  "EPCG License",
  "MEIS / RoDTEP Claim",
  "IEC Registration",
  "SEZ Advisory",
  "Customs Duty Refund",
  "AEO Certification",
  "Export Documentation",
];

function NewProposalPage() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [client, setClient] = useState(null);
  const [service, setService] = useState(null);
  const [billing, setBilling] = useState("Fixed Fee");
  const [fee, setFee] = useState(450000);
  const [template, setTemplate] = useState(proposalTemplates[0].id);
  const [query, setQuery] = useState("");

  const proposalNo = "ASC/2026-27/00192";
  const canNext =
    (stepIdx === 0 && client) ||
    (stepIdx === 1 && service) ||
    (stepIdx === 2 && fee > 0) ||
    stepIdx >= 3;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/proposals" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Back to proposals
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Proposal</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Proposal No. <span className="font-medium text-foreground">{proposalNo}</span> · Auto-saved just now
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted">
              <Save size={14} /> Save Draft
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted">
              <FileText size={14} /> Export Word
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-900">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {steps.map((s, i) => {
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStepIdx(i)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "bg-slate-900 text-white shadow dark:bg-white dark:text-slate-900"
                        : done
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {done ? <Check size={13} /> : <s.icon size={13} />}
                    {s.label}
                  </button>
                  {i < steps.length - 1 && <div className="h-px w-4 bg-border sm:w-8" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            {stepIdx === 0 && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold">Step 1 · Select Client</div>
                  <div className="text-xs text-muted-foreground">Pick an existing client. You can create multiple proposals for the same client.</div>
                </div>
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search clients…"
                    className="w-full rounded-xl border border-border bg-background px-9 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30"
                  />
                </div>
                <div className="space-y-2">
                  {companiesData
                    .filter((c) => !query || c.name.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 8)
                    .map((c) => {
                      const selected = client === c.name;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setClient(c.name)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition",
                            selected
                              ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                              : "border-border bg-card hover:bg-muted/60",
                          )}
                        >
                          <div>
                            <div className="text-sm font-semibold">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {c.industry} · {c.primaryContact} · {c.phone.slice(0, 12)}
                            </div>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            c.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : c.status === "Prospect"
                                ? "bg-blue-50 text-blue-700 ring-blue-200"
                                : "bg-slate-100 text-slate-700 ring-slate-200")}>
                            {c.status === "Active" ? "Existing" : c.status}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {stepIdx === 1 && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold">Step 2 · Select Service</div>
                  <div className="text-xs text-muted-foreground">Choose the advisory service to include in this proposal.</div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {services.map((s) => {
                    const selected = service === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setService(s)}
                        className={cn(
                          "rounded-xl border p-3.5 text-left text-sm transition",
                          selected
                            ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                            : "border-border bg-card hover:bg-muted/60",
                        )}
                      >
                        <div className="font-semibold">{s}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">Standard advisory scope · 30-day validity</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {stepIdx === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold">Step 3 · Commercial Terms</div>
                  <div className="text-xs text-muted-foreground">Configure fee structure and billing cadence.</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Billing Model">
                    <select value={billing} onChange={(e) => setBilling(e.target.value)} className={inputCls}>
                      <option>Fixed Fee</option>
                      <option>Retainer</option>
                      <option>Milestone</option>
                      <option>Success Fee</option>
                    </select>
                  </Field>
                  <Field label="Total Fee (₹)">
                    <input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} className={inputCls} />
                  </Field>
                  <Field label="Milestone Split">
                    <input placeholder="e.g. 40 / 40 / 20" className={inputCls} defaultValue="40 / 40 / 20" />
                  </Field>
                  <Field label="Validity">
                    <input className={inputCls} defaultValue="30 days" />
                  </Field>
                  <Field label="Payment Terms" className="sm:col-span-2">
                    <textarea rows={3} className={inputCls} defaultValue="Net 15 days from invoice date. GST as applicable." />
                  </Field>
                </div>
              </div>
            )}

            {stepIdx === 3 && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold">Step 4 · Choose Template</div>
                  <div className="text-xs text-muted-foreground">Pick a layout for the generated document.</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {proposalTemplates.map((t) => {
                    const selected = template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition",
                          selected
                            ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                            : "border-border bg-card hover:bg-muted/60",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-semibold">{t.name}</div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</div>
                          </div>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{t.format}</span>
                        </div>
                        <div className="mt-3 text-[11px] text-muted-foreground">Used {t.usedCount} times · {t.category}</div>
                      </button>
                    );
                  })}
                </div>
                <Link to="/proposals/templates" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
                  Manage templates →
                </Link>
              </div>
            )}

            {stepIdx === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Step 5 · Preview</div>
                    <div className="text-xs text-muted-foreground">This is how the client will see the proposal.</div>
                  </div>
                  <button className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">Open full preview</button>
                </div>
                <div className="rounded-xl border border-border bg-gradient-to-b from-white to-slate-50 p-6 shadow-inner dark:from-slate-900 dark:to-slate-950">
                  <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">EXIM Advisory</div>
                      <div className="text-lg font-bold">Advisory Services Proposal</div>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      <div>Proposal No. {proposalNo}</div>
                      <div>Date: {new Date().toISOString().slice(0, 10)}</div>
                    </div>
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Prepared for</div>
                      <div className="font-semibold">{client ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Service</div>
                      <div className="font-semibold">{service ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Commercial</div>
                      <div className="font-semibold">{billing} · ₹{fee.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Template</div>
                      <div className="font-semibold">{proposalTemplates.find((t) => t.id === template)?.name}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Scope, deliverables, timelines and terms will render here from the selected template.
                  </div>
                </div>
              </div>
            )}

            {stepIdx === 5 && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold">Step 6 · Approve</div>
                  <div className="text-xs text-muted-foreground">Route to a partner for approval before generating the final document.</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={16} /> Ready for approval
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Field label="Approver">
                      <select className={inputCls}>
                        <option>Nikhil Rao (Sales Lead)</option>
                        <option>Simran Kaur (Partner)</option>
                        <option>Kabir Malhotra (Director)</option>
                      </select>
                    </Field>
                    <Field label="Notes to approver">
                      <input className={inputCls} placeholder="Optional note…" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {stepIdx === 6 && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold">Step 7 · Generate</div>
                  <div className="text-xs text-muted-foreground">Generate the final document and share it with the client.</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Generate PDF", icon: Download, tone: "from-indigo-500 to-violet-600" },
                    { label: "Generate Word", icon: FileText, tone: "from-emerald-500 to-teal-600" },
                    { label: "Send via Email", icon: Sparkles, tone: "from-amber-500 to-rose-500" },
                  ].map((g) => (
                    <button
                      key={g.label}
                      className={cn("group rounded-2xl bg-gradient-to-br p-5 text-left text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-xl", g.tone)}
                    >
                      <g.icon size={20} />
                      <div className="mt-3 text-sm font-semibold">{g.label}</div>
                      <div className="text-[11px] text-white/80">One click</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate({ to: "/proposals" })}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  Finish & return to list <ArrowRight size={13} />
                </button>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                disabled={stepIdx === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium disabled:opacity-40 hover:bg-muted"
              >
                <ArrowLeft size={13} /> Previous
              </button>
              <button
                onClick={() => setStepIdx((s) => Math.min(steps.length - 1, s + 1))}
                disabled={!canNext || stepIdx === steps.length - 1}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 disabled:opacity-40"
              >
                Next <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <aside className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm font-semibold">Proposal Summary</div>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Client" value={client ?? "—"} />
                <SummaryRow label="Service" value={service ?? "—"} />
                <SummaryRow label="Commercial" value={`${billing} · ₹${(fee / 100000).toFixed(2)}L`} />
                <SummaryRow label="Template" value={proposalTemplates.find((t) => t.id === template)?.name ?? "—"} />
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-violet-500/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles size={13} /> AI Suggestion
              </div>
              <div className="mt-1 text-[12px] text-indigo-900/80 dark:text-indigo-100/80">
                Similar clients in this industry accept 40/40/20 milestone billing with 30-day validity.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30";

function Field({ label, children, className }) {
  return (
    <label className={cn("block", className)}>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-semibold">{value}</span>
    </div>
  );
}
