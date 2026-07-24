import { cn } from "@/lib/utils";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Building2,
  FileText,
  Handshake,
  LayoutDashboard,
  LayoutTemplate,
  Sparkles,
  UserCheck,
  Users,
  Video,
  UserPlus,
} from "lucide-react";

const navSections = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Sales & Pipeline",
    items: [
      { to: "/leads", label: "Leads", icon: Users },
      { to: "/deals", label: "Deals", icon: Handshake },
      { to: "/proposals", label: "Proposals", icon: FileText },
      { to: "/proposals/templates", label: "Templates", icon: LayoutTemplate },
    ],
  },
  {
    title: "Accounts & Network",
    items: [
      { to: "/companies", label: "Companies", icon: Building2 },
      { to: "/contacts", label: "Contacts", icon: UserCheck },
    ],
  },
  {
    title: "Team & Operations",
    items: [
      { to: "/employees", label: "Employees", icon: UserPlus },
      { to: "/meetings", label: "Meetings", icon: Video },
      { to: "/services", label: "Services", icon: Briefcase },
    ],
  },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border/80">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25">
          <Sparkles className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white tracking-wide">EXIM Advisory</div>
          <div className="truncate text-[10px] font-medium text-indigo-300/80 uppercase tracking-wider">
            Global Trade CRM
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
              {section.title}
            </div>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.to ||
                  (item.to !== "/" && item.to !== "/landing" && pathname.startsWith(item.to));

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent text-white font-semibold shadow-sm border-l-2 border-indigo-400 pl-2.5"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-indigo-300" : "text-sidebar-foreground/50 group-hover:text-white"
                      )}
                      size={17}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer (Pipeline Health removed) */}
      <div className="border-t border-sidebar-border/80 p-3.5">
        <SignedIn>
          <div className="flex items-center gap-3 rounded-xl  bg-gray-200 border border-sidebar-border/50 p-2">
            <UserButton showName />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-xs font-semibold text-white hover:from-indigo-500 hover:to-violet-500 transition shadow-md shadow-indigo-500/20 cursor-pointer">
              Sign In to Account
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </aside>
  );
}
