import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [templatesList, setTemplatesList] = useState(defaultTemplates);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef(null);

  const categories = ["All", "General", "Government", "Retainer", "Milestone"];
  const rows = templatesList.filter((t) => {
    const q = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase());
    const c = category === "All" || t.category === category;
    return q && c;
  });

  function addFiles(files) {
    if (!files) return;
    const items = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      format: f.name.split(".").pop()?.toUpperCase() ?? "FILE",
      progress: 0,
      done: false,
    }));
    setUploads((prev) => [...items, ...prev]);
    items.forEach((it) => {
      const timer = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.id !== it.id) return u;
            const next = Math.min(100, u.progress + 12 + Math.random() * 20);
            return { ...u, progress: next, done: next >= 100 };
          }),
        );
      }, 220);
      setTimeout(() => clearInterval(timer), 2400);
    });
  }

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
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg"
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
              : "border-border bg-card",
          )}
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <UploadCloud size={20} />
          </div>
          <div className="mt-3 text-sm font-semibold">Drop template files here</div>
          <div className="text-xs text-muted-foreground">PDF, DOCX or HTML · up to 20MB each</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <Upload size={13} /> Choose files
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium hover:bg-muted"
            >
              <LayoutTemplate size={13} /> Create from scratch
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.html"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {uploads.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Uploads</div>
              <button onClick={() => setUploads([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
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
                      {(u.size / 1024).toFixed(1)} KB · {u.done ? "Uploaded" : `${Math.round(u.progress)}%`}
                    </div>
                  </div>
                  {u.done ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <button onClick={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing templates */}
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
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                    category === c ? "border-indigo-500 bg-indigo-500/10 text-indigo-600" : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
            {rows.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No templates match your filters.</div>
            )}
          </div>
        </div>
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} onFiles={(f) => addFiles(f)} />}
    </AppLayout>
  );
}

function TemplateCard({ template: t }) {
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
        <span>Used {t.usedCount}×</span>
      </div>
      <div className="mt-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
        <button className="flex-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-muted"><Download size={12} className="mr-1 inline" />Download</button>
        <button className="flex-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-muted"><Copy size={12} className="mr-1 inline" />Duplicate</button>
        <button className="rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onFiles }) {
  const ref = useRef(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">Upload Template</div>
            <div className="text-xs text-muted-foreground">Add a reusable proposal template to your library.</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X size={16} /></button>
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
            onClick={() => ref.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-3 py-6 text-sm text-muted-foreground hover:border-indigo-400 hover:text-foreground"
          >
            <UploadCloud size={16} /> Click to choose file (PDF, DOCX, HTML)
          </button>
          <input ref={ref} type="file" accept=".pdf,.doc,.docx,.html" className="hidden" onChange={(e) => { onFiles(e.target.files); onClose(); }} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">Cancel</button>
          <button onClick={onClose} className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md">Save Template</button>
        </div>
      </div>
    </div>
  );
}
