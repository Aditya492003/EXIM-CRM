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
  SendHorizontal,
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
  Mail,
  Send,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
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
  { id: "client", label: "1. Select Client", icon: Building2 },
  { id: "service", label: "2. Select Service", icon: FileText },
  { id: "template", label: "3. Choose Template", icon: LayoutTemplate },
  { id: "editor", label: "4. Live Editor", icon: Edit3 },
  { id: "save", label: "5. Save & Send", icon: Save },
  { id: "export", label: "6. Export", icon: Download },
];

/* ───────────────────────── Standard Placeholders ───────────────────────── */
const DEFAULT_PLACEHOLDERS = [
  { key: "date", label: "Proposal Date", category: "General" },
  { key: "client_name", label: "Client Company", category: "Client" },
  { key: "client_email", label: "Client Email", category: "Client" },
  { key: "address", label: "Client Address", category: "Client" },
  { key: "service_fee", label: "Service Fee (₹)", category: "Commercial" },
  { key: "proposal_no", label: "Proposal Number", category: "General" },
  { key: "validity", label: "Validity Period", category: "Commercial" },
];

function NewProposalPage() {
  const navigate = useNavigate();
  const api = useApi();
  const [stepIdx, setStepIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [savingProposal, setSavingProposal] = useState(false);
  const [dbCompanies, setDbCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [dbServices, setDbServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [dbTemplates, setDbTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [emailSuccessModalData, setEmailSuccessModalData] = useState(null);

  useEffect(() => {
    api.get("/employees").then(res => setEmployees(res.data?.data || [])).catch(() => { });
    api.get("/companies")
      .then(res => setDbCompanies(res.data?.data || []))
      .catch((err) => console.error("Failed to load companies for proposal", err))
      .finally(() => setLoadingCompanies(false));
    api.get("/services")
      .then(res => setDbServices(res.data?.data || []))
      .catch((err) => console.error("Failed to load services for proposal", err))
      .finally(() => setLoadingServices(false));
    api.get("/templates")
      .then(res => setDbTemplates(res.data?.data || []))
      .catch((err) => console.error("Failed to load templates for proposal", err))
      .finally(() => setLoadingTemplates(false));
  }, [api]);

  const generateCompiledDocxFile = () => {
    if (!templateBuffer) return null;
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

      const fileName = `${formData.client_name || "Proposal"}_${formData.proposal_no || "PRO"}.docx`.replace(/[^a-zA-Z0-9._-]/g, "_");
      return new File([outBlob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    } catch (err) {
      console.error("Failed to generate compiled DOCX document", err);
      return null;
    }
  };

  const handleSaveAndSendProposal = async () => {
    try {
      setSavingProposal(true);
      const numericValue = parseFloat(String(formData.service_fee || "").replace(/[^0-9.]/g, "")) || 0;
      const targetEmail = (formData.client_email || clientObj?.email || "").trim();

      const compiledFile = generateCompiledDocxFile();

      const fd = new FormData();
      fd.append("title", `${formData.client_name || "Client"} - Proposal`);
      fd.append("client", formData.client_name || clientObj?.name || "Client");
      fd.append("clientEmail", targetEmail);
      fd.append("service", serviceObj?.title || serviceObj?.name || "Services");
      fd.append("value", String(numericValue));
      fd.append("status", "Sent");
      fd.append("assignedTo", assignedTo || "");
      fd.append("sendEmail", "true");

      if (compiledFile) {
        fd.append("attachment", compiledFile);
      } else if (selectedTemplate?.fileUrl) {
        fd.append("attachmentUrl", selectedTemplate.fileUrl);
      }

      const res = await api.post("/proposals", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        const msg = res.data?.emailMessage || (targetEmail ? `Proposal email & edited document sent directly to ${targetEmail} via Nodemailer!` : "Proposal saved & marked as Sent");
        toast.success(msg);
        setSaved(true);

        // Open Email Success Pop-up Modal!
        setEmailSuccessModalData({
          to: targetEmail || "Client Email",
          clientName: formData.client_name || clientObj?.name || "Client",
          proposalNo: formData.proposal_no || "PRO-2026-001",
          serviceFee: formData.service_fee || "0",
          docName: `${formData.client_name || "Proposal"}_${formData.proposal_no || "PRO"}.docx`.replace(/[^a-zA-Z0-9._-]/g, "_"),
          message: res.data?.emailMessage || "Proposal email & compiled edited document delivered directly via Nodemailer!",
        });

        // Auto-advance to Export step
        setStepIdx(5);
      }
    } catch (err) {
      console.error("Failed to save and send proposal", err);
      toast.error(err.response?.data?.message || "Failed to save proposal to database");
    } finally {
      setSavingProposal(false);
    }
  };

  const [sendingDirectEmail, setSendingDirectEmail] = useState(false);

  const handleSendDirectEmail = async () => {
    const targetEmail = (formData.client_email || clientObj?.email || "").trim();
    if (!targetEmail) {
      toast.error("Please enter a client email address in the placeholder form");
      return;
    }
    try {
      setSendingDirectEmail(true);
      const compiledFile = generateCompiledDocxFile();

      const fd = new FormData();
      fd.append("recipientEmail", targetEmail);
      fd.append("clientName", formData.client_name || clientObj?.name || "Client");
      fd.append("proposalNumber", formData.proposal_no || "PRO-2026-001");
      fd.append("title", `${formData.client_name || "Client"} - Proposal`);
      fd.append("serviceFee", String(formData.service_fee || "0"));

      if (compiledFile) {
        fd.append("attachment", compiledFile);
      }

      const res = await api.post("/proposals/send-email", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(res.data?.message || `Proposal email & edited document delivered directly to ${targetEmail}!`);

        // Open Email Success Pop-up Modal!
        setEmailSuccessModalData({
          to: targetEmail || "Client Email",
          clientName: formData.client_name || clientObj?.name || "Client",
          proposalNo: formData.proposal_no || "PRO-2026-001",
          serviceFee: formData.service_fee || "0",
          docName: `${formData.client_name || "Proposal"}_${formData.proposal_no || "PRO"}.docx`.replace(/[^a-zA-Z0-9._-]/g, "_"),
          message: res.data?.message || `Proposal email & edited document delivered directly to ${targetEmail}!`,
        });
      }
    } catch (err) {
      console.error("Failed to send direct email", err);
      toast.error(err.response?.data?.message || "Failed to send direct proposal email");
    } finally {
      setSendingDirectEmail(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSavingProposal(true);
      const numericValue = parseFloat(String(formData.service_fee || "").replace(/[^0-9.]/g, "")) || 0;
      const payload = {
        title: `${formData.client_name || "Client"} - Proposal`,
        client: formData.client_name || clientObj?.name || "Client",
        service: serviceObj?.title || serviceObj?.name || "Services",
        value: numericValue,
        status: "Draft",
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedTo: assignedTo || null,
      };
      const res = await api.post("/proposals", payload);
      if (res.data?.success) {
        toast.success("Proposal saved as Draft!");
        setSaved(true);
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
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  /* Form Data for Placeholders */
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString("en-GB"),
    proposal_no: "ASC/2026-27/00192",
    client_name: "Tata Consultancy Services Limited",
    contact_person: "Mr. Satheendran S",
    client_email: "satheendran@tcs.com",
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
  const [detectedTags, setDetectedTags] = useState([]);

  /* Helper to auto-resolve values for DOCX tags */
  const autoResolveTagValue = (tag, currentClientObj, currentServiceObj, prevFormData) => {
    const t = tag.toLowerCase().trim();

    // 1. Company / Client Name variations
    if (["company_name", "companyname", "company", "client_name", "clientname", "client", "client_company", "company_title"].includes(t)) {
      if (currentClientObj?.name) return currentClientObj.name;
    }

    // 2. Company / Client Email variations
    if (["client_email", "company_email", "email", "clientemail", "companyemail"].includes(t)) {
      if (currentClientObj?.email) return currentClientObj.email;
    }

    // 3. Company / Client Address variations
    if (["address", "client_address", "company_address", "clientaddress", "companyaddress"].includes(t)) {
      if (currentClientObj?.address) return currentClientObj.address;
      if (currentClientObj?.industry) return `${currentClientObj.industry} Sector`;
    }

    // 4. Contact Person variations
    if (["contact_person", "contactperson", "contact_name", "contact", "client_contact", "attn"].includes(t)) {
      if (currentClientObj?.primaryContact) return currentClientObj.primaryContact;
    }

    // 5. Date variations
    if (["date", "proposal_date", "today_date", "current_date", "created_date"].includes(t)) {
      return new Date().toLocaleDateString("en-GB");
    }

    // 6. Service Name variations
    if (["service", "service_name", "servicename", "advisory_service", "job", "job_name"].includes(t)) {
      if (currentServiceObj?.name) return currentServiceObj.name;
    }

    // 7. Service Fee variations
    if (["service_fee", "servicefee", "fee", "amount", "total_fee", "price"].includes(t)) {
      if (currentServiceObj) {
        const rawPrice = currentServiceObj.price ?? currentServiceObj.fee ?? "";
        const numStr = String(rawPrice).replace(/[^\d]/g, "");
        if (numStr) return Number(numStr).toLocaleString("en-IN");
      }
    }

    return prevFormData?.[tag] ?? "";
  };

  /* Auto-fill placeholders when Client changes */
  useEffect(() => {
    if (clientObj) {
      setFormData((prev) => {
        const updated = { ...prev };
        const companyVal = clientObj.name || "";
        const emailVal = clientObj.email || prev.client_email || "";
        const addressVal = clientObj.address || `${clientObj.industry || "General"} Sector`;
        const contactVal = clientObj.primaryContact || "Primary Contact";

        // Assign to all variations of company / client name
        ["client_name", "company_name", "companyname", "company", "client", "client_company", "company_title"].forEach((key) => {
          updated[key] = companyVal;
        });

        // Assign to all variations of email
        ["client_email", "company_email", "email", "clientemail", "companyemail"].forEach((key) => {
          updated[key] = emailVal;
        });

        // Assign to all variations of address
        ["address", "client_address", "company_address", "clientaddress", "companyaddress"].forEach((key) => {
          updated[key] = addressVal;
        });

        // Assign to all variations of contact person
        ["contact_person", "contactperson", "contact_name", "contact", "client_contact"].forEach((key) => {
          updated[key] = contactVal;
        });

        return updated;
      });
    }
  }, [clientObj]);

  /* Auto-fill placeholders when Service changes */
  useEffect(() => {
    if (serviceObj) {
      const rawPrice = serviceObj.price ?? serviceObj.fee ?? "";
      const numStr = String(rawPrice).replace(/[^\d]/g, "");
      const formattedFee = numStr ? Number(numStr).toLocaleString("en-IN") : String(rawPrice);
      const serviceNameVal = serviceObj.name || "";

      setFormData((prev) => {
        const updated = { ...prev };
        if (formattedFee) {
          ["service_fee", "servicefee", "fee", "amount", "total_fee", "price"].forEach((key) => {
            updated[key] = formattedFee;
          });
        }
        ["service", "service_name", "servicename", "advisory_service", "job", "job_name"].forEach((key) => {
          updated[key] = serviceNameVal;
        });
        return updated;
      });
    }
  }, [serviceObj]);

  /* Extract all unique {placeholder} tags from DOCX XML */
  useEffect(() => {
    if (!templateBuffer) return;
    try {
      const zip = new PizZip(templateBuffer);
      const docXml = zip.file("word/document.xml")?.asText() || "";
      // Strip XML tags inside Word text nodes to get clean text
      const cleanText = docXml.replace(/<[^>]+>/g, "");
      const matches = cleanText.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
      const tags = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, "").trim())));
      setDetectedTags(tags);

      // Auto-initialize and auto-resolve values for all detected tags
      setFormData((prev) => {
        const updated = { ...prev };
        tags.forEach((tag) => {
          const autoVal = autoResolveTagValue(tag, clientObj, serviceObj, prev);
          if (autoVal || !(tag in updated) || updated[tag] === "") {
            updated[tag] = autoVal;
          }
        });
        return updated;
      });
    } catch (err) {
      console.error("Failed to extract DOCX tags", err);
    }
  }, [templateBuffer, clientObj, serviceObj]);

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
    stepIdx === 5;

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
        {loadingCompanies ? (
          <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-indigo-500" /> Loading stored companies…
          </div>
        ) : dbCompanies.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No companies found in database. Please create a company first in the Companies section.
          </div>
        ) : (
          dbCompanies
            .filter((c) => !clientSearchQuery || c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
            .map((c) => {
              const compId = c._id || c.id;
              const isSelected = client === compId;
              return (
                <button
                  key={compId}
                  onClick={() => {
                    setClient(compId);
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
                        {c.industry || "General"} {c.primaryContact ? `· Contact: ${c.primaryContact}` : ""} {c.email ? `· ${c.email}` : ""}
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
                      {c.status || "Active"}
                    </span>
                    {isSelected && <Check size={16} className="text-indigo-600" />}
                  </div>
                </button>
              );
            })
        )}
      </div>
    </div>
  );

  /* Step 2: Select Service */
  const filteredServices = dbServices.filter((s) =>
    !serviceSearchQuery ||
    s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(serviceSearchQuery.toLowerCase()))
  );

  const ServiceStep = (
    <div className="space-y-4">
      <StepHeader step={2} title="Select Advisory Service" sub="Select an active service from your workspace database to auto-load scope." />
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={serviceSearchQuery}
          onChange={(e) => setServiceSearchQuery(e.target.value)}
          placeholder="Search services by title or scope…"
          className={inputCls + " pl-9"}
        />
      </div>
      <div className="max-h-[420px] overflow-y-auto pr-1 grid gap-3 sm:grid-cols-2">
        {loadingServices ? (
          <div className="col-span-full p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-indigo-500" /> Loading stored services…
          </div>
        ) : dbServices.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-muted-foreground">
            No active services found in database. Please create a service first in the Services section.
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-muted-foreground">
            No services matching "{serviceSearchQuery}".
          </div>
        ) : (
          filteredServices.map((s) => {
            const servId = s._id || s.id;
            const isSelected = service === servId;
            return (
              <button
                key={servId}
                onClick={() => {
                  setService(servId);
                  setServiceObj(s);
                }}
                className={cn(
                  "rounded-xl border p-4 text-left transition cursor-pointer",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                    : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{s.description || "Advisory service"}</div>
                  </div>
                  {isSelected && <Check size={15} className="mt-0.5 shrink-0 text-indigo-600" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  /* Step 3: Choose Template */
  const defaultBuiltInTemplate = {
    id: "aeo-template",
    _id: null,
    name: "Engagement Letter — AEO T1 & T2",
    description: "Standard ASC Group proposal template with placeholders",
    category: "General",
    fileUrl: "/proposal_template.docx",
    format: "DOCX",
    status: "Published",
    usedCount: 42,
    isBuiltIn: true,
  };

  const allTemplates = [defaultBuiltInTemplate, ...dbTemplates];

  const [templateSearch, setTemplateSearch] = useState("");
  const filteredTemplates = allTemplates.filter((t) =>
    !templateSearch ||
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(templateSearch.toLowerCase()) ||
    (t.category || "").toLowerCase().includes(templateSearch.toLowerCase())
  );

  const TemplateStep = (
    <div className="space-y-4">
      <StepHeader step={3} title="Choose DOCX Template" sub="Select from your uploaded templates or use the built-in standard template." />

      {/* Search bar */}
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={templateSearch}
          onChange={(e) => setTemplateSearch(e.target.value)}
          placeholder="Search templates…"
          className="w-full rounded-xl border border-border bg-card px-9 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30"
        />
      </div>

      {/* Selected indicator */}
      {selectedTemplate && (
        <div className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 px-3 py-2 text-xs">
          <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">Selected:</span>
          <span className="text-indigo-800 dark:text-indigo-200">{selectedTemplate.name}</span>
        </div>
      )}

      {/* Templates grid */}
      {loadingTemplates ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading templates…</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No templates found.{" "}
          <a href="/proposals/templates" className="text-indigo-600 underline">Upload one →</a>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredTemplates.map((t) => {
            const tid = t._id || t.id;
            const isSelected = selectedTemplate?.id === tid || selectedTemplate?._id === t._id;
            return (
              <button
                key={tid}
                onClick={() =>
                  setSelectedTemplate({
                    id: tid,
                    _id: t._id,
                    name: t.name,
                    fileUrl: t.fileUrl,
                    category: t.category,
                    format: t.format || "DOCX",
                    isBuiltIn: t.isBuiltIn || false,
                  })
                }
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition cursor-pointer",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200/60 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
                    : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                    <FileText size={14} />
                  </div>
                  {isSelected && <Check size={15} className="text-indigo-600 shrink-0 mt-0.5" />}
                </div>
                <div className="mt-2 text-sm font-bold leading-snug line-clamp-2">{t.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{t.description || "Proposal template"}</div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 font-semibold",
                    t.isBuiltIn
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                  )}>
                    {t.isBuiltIn ? "Built-in" : "Cloudinary"}
                  </span>
                  <span className="text-muted-foreground">{t.category}</span>
                  <span className="text-muted-foreground uppercase font-mono">{t.format || "DOCX"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick link to upload more */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <span>Need a different template?</span>
        <a
          href="/proposals/templates"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
        >
          <Plus size={12} /> Upload Template
        </a>
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

        {/* Dynamic Placeholders Form - Automatically Rendered from DOCX Tags */}
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {/* Detected DOCX Tags */}
          {detectedTags.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Detected Template Tags ({detectedTags.length})
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                  Auto-Inspected
                </span>
              </div>
              {detectedTags.map((tagKey) => {
                const prettyLabel = tagKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <div key={tagKey} className="space-y-1">
                    <label className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>{prettyLabel}</span>
                      <code className="text-[10px] lowercase text-indigo-600 dark:text-indigo-400 font-mono">{`{${tagKey}}`}</code>
                    </label>
                    <input
                      value={formData[tagKey] ?? ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [tagKey]: e.target.value }))}
                      className={inputCls}
                      placeholder={`Enter ${prettyLabel.toLowerCase()}…`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback to Standard Placeholders if no tags detected yet */
            DEFAULT_PLACEHOLDERS.map((ph) => (
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
            ))
          )}

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

  /* Step 5: Save & Send */
  const SaveStep = (
    <div className="space-y-5">
      <StepHeader step={5} title="Save & Send Proposal" sub="Review final details, optionally assign to an employee, then save and send directly — no approval needed." />
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <label className="block text-xs font-semibold">Assign Proposal to Employee (Optional)</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className={inputCls}
        >
          <option value="">— Unassigned (Self) —</option>
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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveAndSendProposal}
            disabled={savingProposal}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
          >
            <SendHorizontal size={15} /> {savingProposal ? "Saving & Sending…" : "Save & Send Proposal"}
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={savingProposal}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold shadow-sm hover:bg-muted disabled:opacity-60"
          >
            <Save size={15} /> Save as Draft
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={16} /> Proposal saved & sent successfully! Proceeding to export…
          </div>
          <button
            onClick={() => setStepIdx(5)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md"
          >
            Continue to Export <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );

  /* Step 6: Export */
  const ExportStep = (
    <div className="space-y-5">
      <StepHeader step={6} title="Export & Dispatch" sub="Download pixel-perfect DOCX file generated via docxtemplater." />
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
        <button
          onClick={handleSendDirectEmail}
          disabled={sendingDirectEmail}
          className="group rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 p-6 text-left text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-1 hover:shadow-xl cursor-pointer disabled:opacity-60"
        >
          <Mail size={24} />
          <div className="mt-4 text-sm font-bold">
            {sendingDirectEmail ? "Dispatching Email…" : "Send Email to Client"}
          </div>
          <div className="mt-0.5 text-[11px] text-white/80 font-medium">
            {formData.client_email ? `Direct Nodemailer to ${formData.client_email}` : "Direct email (No Gmail app needed)"}
          </div>
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

  const stepContent = [ClientStep, ServiceStep, TemplateStep, EditorStep, SaveStep, ExportStep];

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
              {saved && <span className="ml-2 text-emerald-600 font-semibold">· Saved & Sent</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={savingProposal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted disabled:opacity-50"
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

      {/* Email Success Pop-up Modal */}
      {emailSuccessModalData && (
        <EmailSuccessModal
          data={emailSuccessModalData}
          onClose={() => setEmailSuccessModalData(null)}
          onExport={handleExportDocx}
        />
      )}
    </AppLayout>
  );
}

function EmailSuccessModal({ data, onClose, onExport }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl border border-indigo-200/80 bg-card p-6 shadow-2xl space-y-5 dark:border-indigo-900/60">

        {/* Animated Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Proposal Email Delivered! 🎉
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            The customized proposal with filled commercial details has been sent directly to the client's inbox via Nodemailer.
          </p>
        </div>

        {/* Details Card */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Recipient Client Email</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Mail size={13} /> {data.to}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Client Company</span>
            <span className="font-semibold text-foreground">{data.clientName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Proposal Ref No.</span>
            <span className="font-semibold text-foreground">{data.proposalNo}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Commercial Value</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{data.serviceFee}</span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Attached Document</span>
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]" title={data.docName}>
              📄 {data.docName}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span className="font-medium">{data.message}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold hover:bg-muted cursor-pointer"
          >
            <Download size={14} /> Save DOCX File
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
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
