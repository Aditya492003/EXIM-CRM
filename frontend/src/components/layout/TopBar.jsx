import { Bell, Plus, Search, Moon, Sun, LayoutDashboard, Users, Building2, Handshake, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [dark, setDark] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

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
            className="group flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 text-left text-sm text-muted-foreground shadow-sm transition hover:border-primary/30 hover:shadow-md"
          >
            <Search className="h-4 w-4" size={16} />
            <span>Search leads, companies, deals…</span>
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

          <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={() => setOpenSearch(true)}>
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setDark((d) => !d)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
          </Button>
          <Button className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 hover:shadow-lg">
            <Plus size={16} className="mr-1" />
            <span className="hidden sm:inline">Quick Add</span>
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
    { to: "/companies", label: "Companies", icon: Building2 },
    { to: "/deals", label: "Deals", icon: Handshake },
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
  const recent = ["Aarav Sharma", "Orion Exports", "Q3 Textile Export"];
  const suggestions = ["Overdue follow-ups", "Won deals this month", "Unassigned leads"];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-24 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={cn("w-full max-w-xl rounded-2xl border border-border bg-card p-3 shadow-2xl")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-2 pb-3">
          <Search size={16} className="text-muted-foreground" />
          <input autoFocus placeholder="Search leads, companies, deals…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px]">ESC</kbd>
        </div>
        <div className="p-2 text-xs">
          <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</div>
          {recent.map((r) => (
            <div key={r} className="cursor-pointer rounded-lg px-2 py-2 hover:bg-muted">{r}</div>
          ))}
          <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggestions</div>
          {suggestions.map((r) => (
            <div key={r} className="cursor-pointer rounded-lg px-2 py-2 hover:bg-muted">{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
