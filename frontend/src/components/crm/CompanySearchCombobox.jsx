import { useState, useEffect, useRef } from "react";
import { Search, Building2, User, Loader2, Plus, Check } from "lucide-react";
import { useApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function CompanySearchCombobox({
  value,
  onChange,
  onSelectCompany,
  placeholder = "Search or type company name…",
  className,
  required = false,
}) {
  const api = useApi();
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Synchronize internal query with external value prop
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Real-time backend search with debouncing
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/companies?search=${encodeURIComponent(query || "")}&limit=10`);
        setResults(res.data?.data || []);
      } catch (err) {
        console.error("Company search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open, api]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setQuery(newVal);
    onChange(newVal);
    setOpen(true);
  };

  const handleSelect = (company) => {
    setQuery(company.name);
    onChange(company.name);
    if (onSelectCompany) {
      onSelectCompany(company);
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <Building2 className="pointer-events-none absolute left-3 text-muted-foreground" size={15} />
        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 animate-spin text-indigo-500" />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl animate-fade-in custom-scrollbar">
          {loading && results.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-indigo-500" /> Searching companies…
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Matching Companies ({results.length})
              </div>
              {results.map((comp) => {
                const isSelected = query.toLowerCase() === comp.name.toLowerCase();
                return (
                  <button
                    key={comp._id}
                    type="button"
                    onClick={() => handleSelect(comp)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition cursor-pointer",
                      isSelected
                        ? "bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950/60 dark:text-indigo-200"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="truncate">{comp.name}</span>
                        {comp.industry && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {comp.industry}
                          </span>
                        )}
                      </div>
                      {comp.primaryContact && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <User size={10} />
                          <span className="truncate">{comp.primaryContact}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs text-muted-foreground">No matching company found</p>
              <p className="text-[11px] text-indigo-600 mt-1 font-medium">
                "{query}" will be created as a new company
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
