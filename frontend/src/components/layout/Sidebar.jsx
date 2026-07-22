import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Building2, Handshake, Sparkles, FileText, LayoutTemplate, Briefcase, UserCheck, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/contacts", label: "Contacts", icon: UserCheck },
  { to: "/meetings", label: "Meetings", icon: Video },
  { to: "/services", label: "Services", icon: Briefcase },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/deals", label: "Deals", icon: Handshake },
  { to: "/proposals", label: "Proposals", icon: FileText },
  { to: "/proposals/templates", label: "Templates", icon: LayoutTemplate },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">EXIM Advisory</div>
          <div className="truncate text-[11px] text-sidebar-foreground/60">CRM Platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Workspace
        </div>
        {nav.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white shadow-sm ring-1 ring-indigo-400/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", active && "text-indigo-300")} size={18} />
              <span>{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 p-4 ring-1 ring-indigo-400/20">
          <div className="text-xs font-semibold text-white">Pipeline Health</div>
          <div className="mt-1 text-[11px] text-sidebar-foreground/60">You're 82% to quota this month.</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
          </div>
        </div>
      </div>
    </aside>
  );
}
