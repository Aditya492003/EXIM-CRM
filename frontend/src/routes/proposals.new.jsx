import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  LayoutTemplate,
  Save,
  Search,
  Shield,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { companiesData, proposalTemplates, servicesList } from "@/data/dummy";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { renderAsync } from "docx-preview";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/proposals/new")({
  component: NewProposalPage,
});

/* ───────────────────────── Workflow Steps ───────────────────────── */
const STEPS = [
  { id: "client",   label: "1. Select Client",   icon: Building2 },
  { id: "service",  label: "2. Select Service",  icon: FileText },
  { id: "template", label: "3. Choose Template", icon: LayoutTemplate },
  { id: "editor",   label: "4. Live Editor",     icon: Edit3 },
  { id: "save",     label: "5. Save",            icon: Save },
  { id: "approve",  label: "6. Approve",         icon: Shield },
  { id: "export",   label: "7. Export",          icon: Download },
];

/* ───────────────────────── Standard Placeholders ───────────────────────── */
const DEFAULT_PLACEHOLDERS = [
  { key: "date",           label: "Proposal Date",    category: "General" },
  { key: "client_name",    label: "Client Company",   category: "Client" },
  { key: "contact_person", label: "Contact Person",  category: "Client" },
  { key: "address",        label: "Client Address",   category: "Client" },
  { key: "service_fee",    label: "Service Fee (₹)",  category: "Commercial" },
  { key: "proposal_no",    label: "Proposal Number",  category: "General" },
  { key: "validity",       label: "Validity Period", category: "Commercial" },
];

function NewProposalPage() {
  const navigate = useNavigate();
  const api = useApi();
  const [stepIdx, setStepIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approver, setApprover] = useState("Nikhil Rao (Sales Lead)");
  const [approverNote, setApproverNote] = useState("");
  const [employees, setEmployees] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [savingProposal, setSavingProposal] = useState(false);

  useEffect(() => {
    api.get("/employees").then(res => setEmployees(res.data?.data || [])).catch(() => {});
  }, [api]);

  const handleSaveProposal = async (statusOverride = "Draft") => {
    try {
      setSavingProposal(true);
      const numericValue = parseFloat(String(formData.service_fee || "").replace(/[^0-9.]/g, "")) || 0;
      const payload = {
        title: `${formData.client_name || "Client"} - Proposal`,
        client: formData.client_name || clientObj?.name || "Client",
        service: serviceObj?.title || serviceObj?.name || "Services",
        value: numericValue,
        status: statusOverride,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedTo: assignedTo || null,
      };
      const res = await api.post("/proposals", payload);
      if (res.data?.success) {
        toast.success(`Proposal saved successfully as "${statusOverride}"!`);
        setSaved(true);
        if (statusOverride === "Approved" || statusOverride === "Under Review") {
          setApproved(true);
        }
      }
    } catch (err) {
      toast.error("Failed to save proposal to database");
    } finally {
      setSavingProposal(false);
    }
  };

  /* Selection States */
  const [client, setClient] = useState(null);
  const [clientObj, setClientObj] = useState(null);
  const [service, setService] = useState(null);
  const [serviceObj, setServiceObj] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState({
    id: "aeo-template",
    name: "Engagement Letter — AEO T1 & T2",
    fileUrl: "/proposal_template.docx",
    category: "Customs & AEO",
    format: "DOCX",
  });
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  /* Form Data for Placeholders */
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString("en-GB"),
    proposal_no: "ASC/2026-27/00192",
    client_name: "Tata Consultancy Services Limited",
    contact_person: "Mr. Satheendran S",
    address: "10th Flr., A Wing, Kensington, SEZ Powai - Mumbai 400 076",
    service_fee: "2,40,000",
    validity: "30 Days",
  });

  const [customFields, setCustomFields] = useState([]);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  /* Preview Canvas State */
  const canvasRef = useRef(null);
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [zoom, setZoom] = useState(90);

  /* Auto-fill placeholders when Client changes */
  useEffect(() => {
    if (clientObj) {
      setFormData((prev) => ({
        ...prev,
        client_name: clientObj.name,
        contact_person: clientObj.primaryContact,
        address: `${clientObj.industry} Sector, BKC, Mumbai`,
      }));
    }
  }, [clientObj]);

  /* Auto-fill placeholders when Service changes */
  useEffect(() => {
    if (serviceObj) {
      setFormData((prev) => ({
        ...prev,
        service_fee: serviceObj.price.replace("₹", "").trim(),
      }));
    }
  }, [serviceObj]);

  /* Load raw DOCX template buffer when template changes */
  useEffect(() => {
    let active = true;
    async function loadTemplate() {
      try {
        setRenderError(null);
        setRendering(true);
        const res = await fetch(selectedTemplate.fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ${selectedTemplate.fileUrl}`);
        const ab = await res.arrayBuffer();
        if (active) {
          setTemplateBuffer(ab);
        }
      } catch (err) {
        if (active) {
          setRenderError(err.message);
          setRendering(false);
        }
      }
    }
    loadTemplate();
    return () => { active = false; };
  }, [selectedTemplate]);

  /* Re-render live preview whenever templateBuffer or formData changes */
  const renderLivePreview = useCallback(async () => {
    if (!templateBuffer || !canvasRef.current) return;
    setRendering(true);
    setRenderError(null);
    try {
      // 1. Process template with docxtemplater
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
      });

      // Prepare all placeholder data (standard + custom)
      const dataToRender = { ...formData };
      customFields.forEach((cf) => {
        if (cf.key) dataToRender[cf.key] = cf.value;
      });

      doc.render(dataToRender);

      // 2. Generate updated binary buffer
      const outBuffer = doc.getZip().generate({ type: "arraybuffer" });

      // 3. Render directly into canvas element using docx-preview
      canvasRef.current.innerHTML = "";
      await renderAsync(outBuffer, canvasRef.current, null, {
        className: "docx-live-render",
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        useBase64URL: true,
      });

      setRendering(false);
    } catch (err) {
      console.error("Template Render Error:", err);
      setRenderError(err.message || "Failed to render placeholder substitutions");
      setRendering(false);
    }
  }, [templateBuffer, formData, customFields]);

  useEffect(() => {
    if (stepIdx === 3 && templateBuffer) {
      renderLivePreview();
    }
  }, [stepIdx, templateBuffer, renderLivePreview]);

  /* Download processed DOCX */
  const handleExportDocx = () => {
    if (!templateBuffer) return;
    try {
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
      });

      const dataToRender = { ...formData };
      customFields.forEach((cf) => {
        if (cf.key) dataToRender[cf.key] = cf.value;
      });

      doc.render(dataToRender);

      const outBlob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const fileName = `${formData.client_name || "Proposal"}_${selectedTemplate.name}.docx`.replace(/\s+/g, "_");
      saveAs(outBlob, fileName);
    } catch (err) {
      alert("Error generating DOCX: " + err.message);
    }
  };

  /* Validation logic for navigation */
  const canNext =
    (stepIdx === 0 && client) ||
    (stepIdx === 1 && service) ||
    (stepIdx === 2 && selectedTemplate) ||
    stepIdx === 3 ||
    (stepIdx === 4 && saved) ||
    (stepIdx === 5 && approved) ||
    stepIdx === 6;

  const handleAddCustomField = () => {
    if (!newFieldKey.trim()) return;
    const sanitizedKey = newFieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    setCustomFields((prev) => [...prev, { key: sanitizedKey, value: newFieldValue }]);
    setNewFieldKey("");
    setNewFieldValue("");
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  /* ───────────────────────── STEP VIEWS ───────────────────────── */

  /* Step 1: Select Client */
  const ClientStep = (
    <div className="space-y-4">
      <StepHeader step={1} title="Select Client" sub="Choose a client to bind template placeholders automatically." />
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={clientSearchQuery}
          onChange={(e) => setClientSearchQuery(e.target.value)}
          placeholder="Search companies by name or industry…"
          className={inputCls + " pl-9"}
        />
      </div>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {companiesData
          .filter((c) => !clientSearchQuery || c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
          .slice(0, 10)
          .map((c) => {
            const isSelected = client === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setClient(c.id);
                  setClientObj(c);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                    : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isSelected ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.industry} · Contact: {c.primaryContact}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                      c.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : c.status === "Prospect"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : "bg-slate-100 text-slate-700 ring-slate-200"
                    )}
                  >
                    {c.status}
                  </span>
                  {isSelected && <Check size={16} className="text-indigo-600" />}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );

  /* Step 2: Select Service */
  const ServiceStep = (
    <div className="space-y-4">
      <StepHeader step={2} title="Select Advisory Service" sub="Select from 100+ EXIM & Customs services to auto-load fees." />
      <div className="grid gap-3 sm:grid-cols-2">
        {servicesList.map((s) => {
          const isSelected = service === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setService(s.id);
                setServiceObj(s);
              }}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                isSelected
                  ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                  : "border-border bg-card hover:bg-muted/60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{s.description}</div>
                </div>
                {isSelected && <Check size={15} className="mt-0.5 shrink-0 text-indigo-600" />}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{s.category}</span>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{s.price}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Step 3: Choose Template */
  const TemplateStep = (
    <div className="space-y-4">
      <StepHeader step={3} title="Choose DOCX Template" sub="Select standard template or upload custom DOCX template with placeholders." />

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Main Placeholder DOCX Template */}
        <button
          onClick={() =>
            setSelectedTemplate({
              id: "aeo-template",
              name: "Engagement Letter — AEO T1 & T2",
              fileUrl: "/proposal_template.docx",
              category: "Customs & AEO",
              format: "DOCX",
            })
          }
          className={cn(
            "rounded-2xl border-2 p-4 text-left transition",
            selectedTemplate.id === "aeo-template"
              ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
              : "border-border bg-card hover:bg-muted/60"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-bold text-indigo-800 dark:text-indigo-300">📄 AEO T1/T2 Engagement Letter</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Standard ASC Group proposal template with placeholders</div>
            </div>
            {selectedTemplate.id === "aeo-template" && <Check size={16} className="text-indigo-600" />}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">Placeholders Ready</span>
            <span className="text-muted-foreground">DOCX Format</span>
          </div>
        </button>

        {/* Dummy additional templates for 100+ services scaling */}
        {proposalTemplates.map((t) => {
          const isSelected = selectedTemplate.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() =>
                setSelectedTemplate({
                  id: t.id,
                  name: t.name,
                  fileUrl: "/proposal_template.docx",
                  category: t.category,
                  format: t.format,
                })
              }
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                isSelected
                  ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                  : "border-border bg-card hover:bg-muted/60"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</div>
                </div>
                {isSelected && <Check size={16} className="text-indigo-600" />}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Category: {t.category}</span>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{t.format}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* Step 4: Live Editor (Placeholder Engine) */
  const EditorStep = (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* Left Control Panel: Placeholders Form */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold">Template Placeholders</h3>
          </div>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Option 2 Engine
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Modify placeholder values below. Changes instantly inject into your DOCX template and render in real time.
        </p>

        {/* Standard Placeholders Form */}
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {DEFAULT_PLACEHOLDERS.map((ph) => (
            <div key={ph.key} className="space-y-1">
              <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{ph.label}</span>
                <code className="text-[10px] lowercase text-indigo-600 dark:text-indigo-400">{`{${ph.key}}`}</code>
              </label>
              <input
                value={formData[ph.key] ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, [ph.key]: e.target.value }))}
                className={inputCls}
                placeholder={`Enter ${ph.label.toLowerCase()}…`}
              />
            </div>
          ))}

          {/* Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Custom Placeholders
              </div>
              {customFields.map((cf, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="text-[10px] font-mono text-muted-foreground">{`{${cf.key}}`}</div>
                    <input
                      value={cf.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomFields((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                        );
                      }}
                      className={inputCls}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveCustomField(idx)}
                    className="mt-4 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Custom Placeholder */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground">+ Add Custom Placeholder</div>
          <div className="flex gap-2">
            <input
              placeholder="key (e.g. gst_no)"
              value={newFieldKey}
              onChange={(e) => setNewFieldKey(e.target.value)}
              className={inputCls + " text-xs"}
            />
            <input
              placeholder="value"
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value)}
              className={inputCls + " text-xs"}
            />
          </div>
          <button
            onClick={handleAddCustomField}
            disabled={!newFieldKey.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/50 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
          >
            <Plus size={13} /> Add Tag
          </button>
        </div>
      </div>

      {/* Right Preview Canvas */}
      <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border shadow-sm">
        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-slate-900 px-4 py-2.5 text-white dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span className="text-xs font-semibold">{selectedTemplate.name}</span>
            {rendering && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                <RefreshCw size={11} className="animate-spin" /> Rendering…
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="rounded-lg bg-white/10 p-1 hover:bg-white/20"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-xs font-medium min-w-[36px] text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="rounded-lg bg-white/10 p-1 hover:bg-white/20"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={handleExportDocx}
              className="ml-2 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600"
            >
              <Download size={12} /> Save DOCX
            </button>
          </div>
        </div>

        {/* DOCX Live Render Area */}
        <div className="relative min-h-[620px] max-h-[680px] overflow-auto bg-[#525659] p-4">
          {renderError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#525659] p-6 text-center">
              <AlertTriangle size={32} className="text-amber-400" />
              <div className="text-sm font-semibold text-white">Rendering Error</div>
              <div className="text-xs text-white/70 max-w-md">{renderError}</div>
            </div>
          )}

          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
            className="py-4"
          >
            <div ref={canvasRef} id="docx-placeholder-canvas" />
          </div>
        </div>
      </div>
    </div>
  );

  /* Step 5: Save */
  const SaveStep = (
    <div className="space-y-5">
      <StepHeader step={5} title="Save Proposal" sub="Review final placeholder data and save proposal to pipeline." />
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <label className="block text-xs font-semibold">Assign Proposal to Employee</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className={inputCls}
        >
          <option value="">— Unassigned (Manager Only) —</option>
          {employees.map((e) => (
            <option key={e._id} value={e.name}>{e.name} ({e.role || e.department || "Employee"})</option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
        {DEFAULT_PLACEHOLDERS.map((ph) => (
          <div key={ph.key} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{ph.label}</span>
            <span className="font-semibold">{formData[ph.key] || "—"}</span>
          </div>
        ))}
      </div>
      {!saved ? (
        <button
          onClick={() => handleSaveProposal("Draft")}
          disabled={savingProposal}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
        >
          <Save size={15} /> {savingProposal ? "Saving to Database…" : "Save Proposal Draft"}
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={16} /> Proposal saved to MongoDB successfully!
        </div>
      )}
    </div>
  );

  /* Step 6: Approve */
  const ApproveStep = (
    <div className="space-y-5">
      <StepHeader step={6} title="Proposal Approval" sub="Route generated proposal to senior manager for sign-off." />
      <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={15} /> Ready for management review
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Approver">
            <select value={approver} onChange={(e) => setApprover(e.target.value)} className={inputCls}>
              <option>Nikhil Rao (Sales Lead)</option>
              <option>Simran Kaur (Partner)</option>
              <option>Kabir Malhotra (Director)</option>
            </select>
          </Field>
          <Field label="Note to Approver">
            <input
              value={approverNote}
              onChange={(e) => setApproverNote(e.target.value)}
              className={inputCls}
              placeholder="Optional comment…"
            />
          </Field>
        </div>
        {!approved ? (
          <button
            onClick={() => handleSaveProposal("Under Review")}
            disabled={savingProposal}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
          >
            <Shield size={15} /> {savingProposal ? "Submitting…" : "Submit for Approval"}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            <CheckCircle2 size={16} /> Approved & Saved to Database!
          </div>
        )}
      </div>
    </div>
  );

  /* Step 7: Export */
  const ExportStep = (
    <div className="space-y-5">
      <StepHeader step={7} title="Export & Dispatch" sub="Download pixel-perfect DOCX file generated via docxtemplater." />
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={handleExportDocx}
          className="group rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-left text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-1 hover:shadow-xl"
        >
          <Download size={24} />
          <div className="mt-4 text-sm font-bold">Export DOCX</div>
          <div className="mt-0.5 text-[11px] text-white/70">Generated using template placeholders</div>
        </button>
        <button className="group rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-left text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-1 hover:shadow-xl">
          <FileText size={24} />
          <div className="mt-4 text-sm font-bold">Export PDF</div>
          <div className="mt-0.5 text-[11px] text-white/70">High-fidelity print format</div>
        </button>
        <button className="group rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 p-6 text-left text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-1 hover:shadow-xl">
          <Sparkles size={24} />
          <div className="mt-4 text-sm font-bold">Send to Client</div>
          <div className="mt-0.5 text-[11px] text-white/70">Email with attachment</div>
        </button>
      </div>
      <button
        onClick={() => navigate({ to: "/proposals" })}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
      >
        Return to Proposals List <ArrowRight size={13} />
      </button>
    </div>
  );

  const stepContent = [ClientStep, ServiceStep, TemplateStep, EditorStep, SaveStep, ApproveStep, ExportStep];

  return (
    <AppLayout>
      <style>{`
        #docx-placeholder-canvas .docx-live-render section {
          background: white !important;
          box-shadow: 0 4px 24px rgba(0,0,0,.25) !important;
          margin: 0 auto 20px !important;
          border-radius: 4px;
        }
      `}</style>

      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/proposals" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Back to proposals
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Proposal</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Proposal Ref: <span className="font-medium text-foreground">{formData.proposal_no}</span>
              {saved && <span className="ml-2 text-emerald-600 font-semibold">· Saved</span>}
              {approved && <span className="ml-2 text-indigo-600 font-semibold">· Approved</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSaved(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted"
            >
              <Save size={14} /> Save Draft
            </button>
            <button
              onClick={handleExportDocx}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <Download size={14} /> Export DOCX
            </button>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-1">
            {STEPS.map((s, i) => {
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setStepIdx(i)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow"
                        : done
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {done ? <Check size={13} /> : <s.icon size={13} />}
                    {s.label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn("h-px w-3 sm:w-5 transition-colors", done ? "bg-emerald-300" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Content Grid */}
        <div className={cn("grid gap-4", stepIdx === 3 ? "grid-cols-1" : "lg:grid-cols-[1fr_290px]")}>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            {stepContent[stepIdx]}

            {/* Stepper controls */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                disabled={stepIdx === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium disabled:opacity-40 hover:bg-muted"
              >
                <ArrowLeft size={13} /> Previous
              </button>
              <button
                onClick={() => setStepIdx((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={!canNext || stepIdx === STEPS.length - 1}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 disabled:opacity-40"
              >
                Next <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          {stepIdx !== 3 && (
            <aside className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="text-sm font-semibold">Proposal Summary</div>
                <div className="mt-4 space-y-2.5">
                  <SummaryRow label="Client" value={formData.client_name || "—"} />
                  <SummaryRow label="Contact" value={formData.contact_person || "—"} />
                  <SummaryRow label="Fee" value={`₹${formData.service_fee || "—"}`} />
                  <SummaryRow label="Template" value={selectedTemplate.name} />
                </div>
              </div>

              {/* AI suggestion */}
              <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-violet-500/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Sparkles size={13} /> Templating Engine
                </div>
                <div className="mt-1 text-[12px] text-indigo-900/80 dark:text-indigo-100/80">
                  Using docxtemplater placeholder engine. Add any custom `{`key`}` to your Word doc template and map it directly on the left form!
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* Helpers */
const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30";

function StepHeader({ step, title, sub }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step {step}</div>
      <div className="text-lg font-bold">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

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
      <span className="max-w-[60%] truncate text-right text-xs font-semibold">{value}</span>
    </div>
  );
}
