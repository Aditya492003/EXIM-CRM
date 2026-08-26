import { cn } from "@/lib/utils";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  FileText,
  Handshake,
  LayoutDashboard,
  Sparkles,
  Users,
  Video,
  UserCheck,
  Plus,
  LayoutTemplate,
  Boxes,
  User,
} from "lucide-react";

const navSections = [
  {
    title: "Workspace",
    items: [
      { to: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/employee/companies", label: "Companies", icon: Building2 },
      { to: "/contacts", label: "Contacts", icon: UserCheck },
      { to: "/employee/leads", label: "My Leads", icon: Users },
      { to: "/employee/deals", label: "My Deals", icon: Handshake },
      { to: "/collaboration-requests", label: "Collaboration Requests", icon: Handshake },
      { to: "/employee/meetings", label: "My Meetings", icon: Video },
    ],
  },
  {
    title: "Proposals",
    items: [
      { to: "/employee/proposals", label: "My Proposals", icon: FileText },
      { to: "/proposals/new", label: "Create Proposal", icon: Plus },
      { to: "/proposals/templates", label: "Templates", icon: LayoutTemplate },
      { to: "/services", label: "Services", icon: Boxes },
    ],
  },
  {
    title: "profile",
    items: [
      { to: "/employee/about", label: "My Profile", icon: User },
    ],
  },
];


export function EmployeeSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border/80">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-md shadow-blue-500/25">
          <Sparkles className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white tracking-wide">EXIM Advisory</div>
          <div className="truncate text-[10px] font-medium text-blue-300/80 uppercase tracking-wider">
            Employee Portal
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
                const active = pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent text-white font-semibold shadow-sm border-l-2 border-blue-400 pl-2.5"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-blue-300" : "text-sidebar-foreground/50 group-hover:text-white"
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

      {/* User Profile Footer */}
      <div className="border-t border-sidebar-border/80 p-3.5">
        <SignedIn>
          <div className="flex items-center gap-3 rounded-xl bg-gray-200 border border-sidebar-border/50 p-2">
            <UserButton showName />
          </div>
        </SignedIn>
      </div>
    </aside>
  );
}
