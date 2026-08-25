import {
  Bell, Plus, Search, Moon, Sun, LayoutDashboard, Users,
  Building2, Handshake, Globe, UserPlus, FileText, Calendar,
  Loader2, ArrowRight, X
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useApi } from "@/lib/api";

export function TopBar() {
  const { dark, toggleDark } = useTheme();
  const [openSearch, setOpenSearch] = useState(false);
  const { user } = useUser();

  // Global Ctrl+K / Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpenSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <span className="text-xs font-bold text-white">E</span>
          </div>
          <span className="text-sm font-semibold">EXIM CRM</span>
        </div>

        <div className="relative ml-auto hidden max-w-md flex-1 md:ml-0 md:block">
          <button
            onClick={() => setOpenSearch(true)}
            className="group flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 text-left text-sm text-muted-foreground shadow-sm transition hover:border-primary/30 hover:shadow-md cursor-pointer"
          >
            <Search className="h-4 w-4" size={16} />
            <span>Search leads, companies, deals, meetings…</span>
            <kbd className="ml-auto rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
          {openSearch && <SearchPalette onClose={() => setOpenSearch(false)} />}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/landing"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted"
          >
            <Globe size={14} className="text-indigo-500" />
            <span>Landing Page</span>
          </Link>

          <Button variant="ghost" size="icon" className="rounded-xl md:hidden cursor-pointer" onClick={() => setOpenSearch(true)}>
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl cursor-pointer" onClick={toggleDark}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button variant="ghost" size="icon" className="relative rounded-xl cursor-pointer">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
          </Button>

          {/* Clerk Auth Managed Button */}
          <div className="ml-1 flex items-center gap-2">
            <SignedIn>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 shadow-sm">
                <UserButton showName />
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex items-center gap-1.5">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-md">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>

      <MobileNav />
    </header>
  );
}

function MobileNav() {
  const items = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users },
    { to: "/deals", label: "Deals", icon: Handshake },
    { to: "/companies", label: "Companies", icon: Building2 },
    { to: "/meetings", label: "Meetings", icon: Calendar },
    { to: "/employees", label: "Employees", icon: UserPlus },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-t border-border/70 px-3 py-2 lg:hidden">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-primary/10 text-primary" }}
          activeOptions={{ exact: it.to === "/" }}
        >
          <it.icon size={14} />
          {it.label}
        </Link>
      ))}
    </div>
  );
}

function SearchPalette({ onClose }) {
  const api = useApi();
  const navigate = useNavigate();
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    leads: [],
    companies: [],
    deals: [],
    meetings: [],
    proposals: [],
  });

  const isEmployee = user?.publicMetadata?.role === "employee";
  const routes = {
    leads: isEmployee ? "/employee/leads" : "/leads",
    companies: isEmployee ? "/employee/companies" : "/companies",
    deals: isEmployee ? "/employee/deals" : "/deals",
    meetings: isEmployee ? "/employee/meetings" : "/meetings",
    proposals: isEmployee ? "/employee/proposals" : "/proposals",
  };

  // ESC key listener to close search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Live debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ leads: [], companies: [], deals: [], meetings: [], proposals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data?.data || { leads: [], companies: [], deals: [], meetings: [], proposals: [] });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, api]);

  const handleNavigate = (path) => {
    onClose();
    navigate({ to: path });
  };

  const totalResults =
    (results.leads?.length || 0) +
    (results.companies?.length || 0) +
    (results.deals?.length || 0) +
    (results.meetings?.length || 0) +
    (results.proposals?.length || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-20 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/30">
          <Search size={18} className="text-indigo-500 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, companies, deals, meetings, proposals…"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0" />}
          {query && !loading && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
          <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
          {!query.trim() ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="font-semibold text-sm">Global CRM Search</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Type any company name, lead, deal, or meeting title to search in real-time.
              </p>
            </div>
          ) : loading && totalResults === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 size={20} className="animate-spin text-indigo-500" />
              <span>Searching CRM database…</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <p className="font-semibold">No matches found for "{query}"</p>
              <p className="mt-1 text-[11px]">Try checking for typos or searching by company name.</p>
            </div>
          ) : (
            <>
              {/* Companies */}
              {results.companies?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Building2 size={12} className="text-blue-500" /> Companies ({results.companies.length})</span>
                    <button onClick={() => handleNavigate(routes.companies)} className="text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.companies.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => handleNavigate(routes.companies)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground text-sm">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{[c.industry, c.primaryContact || c.phone || c.email].filter(Boolean).join(" · ") || "Company"}</div>
                        </div>
                        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-medium">Company</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leads */}
              {results.leads?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Users size={12} className="text-emerald-500" /> Leads ({results.leads.length})</span>
                    <button onClick={() => handleNavigate(routes.leads)} className="text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.leads.map((l) => (
                      <div
                        key={l._id}
                        onClick={() => handleNavigate(routes.leads)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground text-sm">{l.name}</div>
                          <div className="text-[11px] text-muted-foreground">{[l.company, l.email || l.phone].filter(Boolean).join(" · ") || "Lead"}</div>
                        </div>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium">{l.status || "Lead"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deals */}
              {results.deals?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Handshake size={12} className="text-amber-500" /> Deals ({results.deals.length})</span>
                    <button onClick={() => handleNavigate(routes.deals)} className="text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.deals.map((d) => (
                      <div
                        key={d._id}
                        onClick={() => handleNavigate(routes.deals)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground text-sm">{d.name || d.title || "Untitled Deal"}</div>
                          <div className="text-[11px] text-muted-foreground">{[d.company, d.value ? `₹${Number(d.value).toLocaleString("en-IN")}` : null].filter(Boolean).join(" · ") || "Deal"}</div>
                        </div>
                        <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-medium">{d.stage || "Deal"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meetings */}
              {results.meetings?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-violet-500" /> Meetings ({results.meetings.length})</span>
                    <button onClick={() => handleNavigate(routes.meetings)} className="text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.meetings.map((m) => (
                      <div
                        key={m._id}
                        onClick={() => handleNavigate(routes.meetings)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground text-sm">{m.title || "Untitled Meeting"}</div>
                          <div className="text-[11px] text-muted-foreground">{[m.company, m.attendee || (m.date ? new Date(m.date).toLocaleDateString() : null)].filter(Boolean).join(" · ") || "Meeting"}</div>
                        </div>
                        <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 text-[10px] font-medium">{m.status || "Meeting"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposals */}
              {results.proposals?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5"><FileText size={12} className="text-rose-500" /> Proposals ({results.proposals.length})</span>
                    <button onClick={() => handleNavigate(routes.proposals)} className="text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.proposals.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleNavigate(routes.proposals)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted cursor-pointer transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground text-sm">{p.title || p.number || p.client || p.service || "Proposal"}</div>
                          <div className="text-[11px] text-muted-foreground">{[p.client || p.companyName, p.number, p.value ? `₹${Number(p.value).toLocaleString("en-IN")}` : null].filter(Boolean).join(" · ") || "Proposal"}</div>
                        </div>
                        <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-medium">{p.status || "Proposal"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
