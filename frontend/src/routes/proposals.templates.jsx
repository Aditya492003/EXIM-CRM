import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  LayoutTemplate,
  Plus,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/proposals/templates")({
  component: TemplatesPage,
});

const defaultTemplates = [
  {
    id: "aeo-template",
    name: "Engagement Letter — AEO T1 & T2",
    description: "Standard ASC Group proposal engagement template with interactive DOCX placeholders.",
    category: "General",
    format: "DOCX",
    status: "Published",
    usedCount: 42,
    fileUrl: "/proposal_template.docx"
  }
];

function TemplatesPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/templates");
      const dbTemplates = res.data?.data || [];
      const mapped = dbTemplates.map((t) => ({
        id: t._id || t.id,
        _id: t._id,
        name: t.name,
        description: t.description || "",
        category: t.category || "Custom Upload",
        format: t.format || "DOCX",
        status: t.status || "Published",
        usedCount: t.usedCount || 0,
        fileUrl: t.fileUrl,
      }));
      setTemplatesList([...mapped, ...defaultTemplates]);
    } catch (err) {
      console.error("Failed to load Cloudinary templates", err);
      setTemplatesList(defaultTemplates);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const categories = ["All", "General", "Government", "Retainer", "Milestone", "Custom Upload"];
  const rows = templatesList.filter((t) => {
    const q = !query || t.name.toLowerCase().includes(query.toLowerCase()) || (t.description || "").toLowerCase().includes(query.toLowerCase());
    const c = category === "All" || t.category === category;
    return q && c;
  });

  async function addFiles(files, customMeta = {}) {
    if (!files || files.length === 0) return;

    const rawArray = Array.from(files);
    const validDocxFiles = [];

    rawArray.forEach((f) => {
      if (!f.name.toLowerCase().endsWith(".docx")) {
        toast.error(`Security Restriction: "${f.name}" blocked. Only .docx (Microsoft Word) template files are allowed.`);
      } else if (f.size > 10 * 1024 * 1024) {
        toast.error(`File size error: "${f.name}" exceeds maximum allowed upload limit of 10MB (${(f.size / (1024 * 1024)).toFixed(1)}MB).`);
      } else {
        validDocxFiles.push(f);
      }
    });

    if (validDocxFiles.length === 0) return;

    for (const file of validDocxFiles) {
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const templateName = customMeta.name || file.name.replace(/\.[^/.]+$/, "");
      const templateCategory = customMeta.category || "Custom Upload";

      setUploads((prev) => [
        {
          id: uploadId,
          name: templateName,
          size: file.size,
          format: "DOCX",
          progress: 30,
          done: false,
        },
        ...prev,
      ]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", templateName);
        formData.append("category", templateCategory);
        if (customMeta.description) formData.append("description", customMeta.description);

        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 70 } : u))
        );

        await api.post("/templates", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, done: true } : u))
        );

        toast.success(`Template "${templateName}" uploaded to Cloudinary & published!`);
        fetchTemplates();
      } catch (err) {
        console.error("Cloudinary template upload error", err);
        toast.error(err.response?.data?.message || `Failed to upload "${templateName}" to Cloudinary`);
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }
    }
  }

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Remove template "${template.name}"?`)) return;
    try {
      if (template._id) {
        await api.delete(`/templates/${template._id}`);
      }
      setTemplatesList((prev) => prev.filter((t) => (t._id || t.id) !== (template._id || template.id)));
      toast.success(`Template "${template.name}" removed`);
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/proposals" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Back to proposals
            </Link>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Advisory</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Proposal Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload reusable PDF/DOCX templates the team can pick when drafting proposals.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg cursor-pointer"
          >
            <Plus size={14} /> Upload Template
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
            dragOver
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
              : "border-border bg-card"
          )}
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <UploadCloud size={20} />
          </div>
          <div className="mt-3 text-sm font-semibold">Drop Word (.docx) template files here</div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            Strict Security Enforcement: .docx format only
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 cursor-pointer"
            >
              <Upload size={13} /> Choose DOCX file
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium hover:bg-muted cursor-pointer"
            >
              <LayoutTemplate size={13} /> Create with details
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".docx"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {uploads.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Recent Uploads</div>
              <button onClick={() => setUploads([])} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Clear</button>
            </div>
            <div className="space-y-2">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-[10px] font-bold">{u.format}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", u.done ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-violet-500")}
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {(u.size / 1024).toFixed(1)} KB · {u.done ? "Published to library" : `${Math.round(u.progress)}%`}
                    </div>
                  </div>
                  {u.done ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <button onClick={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))} className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing templates grid */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="w-full rounded-lg border border-border bg-background px-9 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60 dark:focus:ring-indigo-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer",
                    category === c ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 font-semibold" : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
              <div className="mt-2 text-sm font-medium">Loading templates from Cloudinary & DB…</div>
            </div>
          ) : rows.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
              {rows.map((t) => (
                <TemplateCard key={t._id || t.id} template={t} onDelete={() => handleDeleteTemplate(t)} />
              ))}
            </div>
          ) : (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              No templates match your search. Drop a file above to upload one!
            </div>
          )}
        </div>
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} onSave={(files, meta) => addFiles(files, meta)} />}
    </AppLayout>
  );
}

function TemplateCard({ template: t, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
          <FileText size={18} />
        </div>
        <div className="flex gap-1">
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{t.format}</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
              t.status === "Published"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30"
                : "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
            )}
          >
            {t.status}
          </span>
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold">{t.name}</div>
      <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t.description}</div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{t.category}</span>
        <span>Used {t.usedCount || 0}×</span>
      </div>
      <div className="mt-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
        <a
          href={t.fileUrl || "#"}
          download={t.name}
          className="flex-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-muted text-center inline-flex items-center justify-center gap-1"
        >
          <Download size={12} /> Download
        </a>
        <Link
          to="/proposals/new"
          className="flex-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-muted text-center inline-flex items-center justify-center gap-1 text-indigo-600"
        >
          <Copy size={12} /> Use
        </Link>
        <button
          onClick={onDelete}
          className="rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSave }) {
  const ref = useRef(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [selectedFiles, setSelectedFiles] = useState(null);

  const handleSubmit = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }
    onSave(selectedFiles, { name, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">Upload Template</div>
            <div className="text-xs text-muted-foreground">Add a reusable proposal template to your library.</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Template Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60" placeholder="e.g. DGFT Retainer 2026" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Category</div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>General</option>
                <option>Government</option>
                <option>Retainer</option>
                <option>Milestone</option>
                <option>Custom Upload</option>
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Visibility</div>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>Team-wide</option>
                <option>Private</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-3 py-6 text-sm text-muted-foreground hover:border-indigo-400 hover:text-foreground cursor-pointer"
          >
            <UploadCloud size={16} /> {selectedFiles && selectedFiles.length > 0 ? `Selected: ${selectedFiles[0].name}` : "Click to choose .docx file (Microsoft Word only)"}
          </button>
          <input
            ref={ref}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                const f = e.target.files[0];
                if (!f.name.toLowerCase().endsWith(".docx")) {
                  toast.error("Security Restriction: Only .docx (Microsoft Word) files are accepted.");
                  return;
                }
                setSelectedFiles(e.target.files);
                if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
              }
            }}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSubmit} className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md cursor-pointer">Save & Publish Template</button>
        </div>
      </div>
    </div>
  );
}

