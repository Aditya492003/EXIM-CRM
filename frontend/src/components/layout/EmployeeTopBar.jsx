import { cn } from "@/lib/utils";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { Calendar, Search, Bell, ChevronDown, Sun, Moon, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

const statuses = [
  { label: "Available", value: "Available", color: "bg-emerald-500", textCls: "text-emerald-700 dark:text-emerald-400", bgCls: "bg-emerald-50 dark:bg-emerald-500/10" },
  { label: "Working on Leads", value: "Working on Leads", color: "bg-amber-500", textCls: "text-amber-700 dark:text-amber-400", bgCls: "bg-amber-50 dark:bg-amber-500/10" },
  { label: "On Leave", value: "On Leave", color: "bg-rose-500", textCls: "text-rose-700 dark:text-rose-400", bgCls: "bg-rose-50 dark:bg-rose-500/10" },
];

export function EmployeeTopBar() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [currentStatus, setCurrentStatus] = useState(statuses[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // In a real app, fetch initial status from backend on mount.
  // For now, default to Available, and update via API on change.
  
  const handleStatusChange = async (statusObj) => {
    setCurrentStatus(statusObj);
    setDropdownOpen(false);
    
    try {
      const token = await getToken();
      await fetch("http://localhost:5000/api/employees/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ workingStatus: statusObj.value })
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Mobile Menu Trigger (Optional if we reuse existing ones) */}
      <div className="flex flex-1 items-center gap-4 lg:hidden">
        {/* Mock for mobile trigger */}
        <div className="h-8 w-8 rounded-md bg-muted" />
      </div>

      <div className="hidden flex-1 lg:flex" />

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
          <Calendar size={14} className="text-muted-foreground/70" />
          {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105",
              currentStatus.bgCls,
              currentStatus.textCls,
              "border-current/20"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", currentStatus.color)} />
            {currentStatus.label}
            <ChevronDown size={14} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg z-50">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Set your status
              </div>
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium hover:bg-muted transition",
                    currentStatus.value === s.value && "bg-muted/50"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", s.color)} />
                  {s.label}
                  {currentStatus.value === s.value && <span className="ml-auto text-indigo-500">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="rounded-xl cursor-pointer" onClick={toggleDark}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {/* My Profile Link & User Button */}
        <div className="flex items-center gap-3 border-l border-border/50 pl-4">
          <a
            href="/employee/about"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold shadow-xs hover:bg-muted transition"
          >
            <User size={13} className="text-primary" />
            <span>Profile</span>
          </a>
          <UserButton showName />
        </div>
      </div>
    </header>
  );
}
