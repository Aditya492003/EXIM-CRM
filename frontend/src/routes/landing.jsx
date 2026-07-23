import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Building2,
  Users,
  Handshake,
  Video,
  FileText,
  CheckCircle2,
  Globe,
  Briefcase,
  ChevronRight,
  BarChart3,
  Layers,
  LayoutDashboard,
  Clock,
  IndianRupee,
  Star,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

export function LandingPage() {
  const [activeTab, setActiveTab] = useState("hero"); // "hero" | "features"
  const [activeFeature, setActiveFeature] = useState("leads");
  const { user, isSignedIn } = useUser();

  const featureModules = [
    {
      id: "leads",
      title: "Leads & Job Tracking",
      icon: Users,
      badge: "Real-time Status",
      tone: "from-indigo-600 to-blue-600",
      description:
        "Capture, organize, and assign export-import leads. Inline editable status selectors allow status updates in a single click without opening forms.",
      highlights: [
        "Inline Status Switching (New, Contacted, Interested, Converted)",
        "Service & Job Assignment (DGFT Advisory, SEZ, Customs)",
        "Instant CSV Export & Lead Import Support",
      ],
      previewStats: [
        { label: "Active Leads", val: "1,240+" },
        { label: "Conversion Rate", val: "34.2%" },
      ],
    },
    {
      id: "contacts",
      title: "Company Directory & Contacts",
      icon: Building2,
      badge: "Executive Directory",
      tone: "from-emerald-600 to-teal-600",
      description:
        "Manage multiple key decision makers per company account. Filter contacts by company name, mobile number, designation, and direct call/email triggers.",
      highlights: [
        "Multiple Contacts per Company Account",
        "Company Filter Dropdown with Dynamic Counts",
        "One-click Phone & Email Integration",
      ],
      previewStats: [
        { label: "Company Accounts", val: "450+" },
        { label: "Key Executives", val: "1,890" },
      ],
    },
    {
      id: "deals",
      title: "Trade Pipeline & Proposals",
      icon: Handshake,
      badge: "INR Revenue Flow",
      tone: "from-amber-600 to-orange-600",
      description:
        "Visual Kanban trade pipeline with Rupee (₹) currency metrics. Generate compliant trade proposals with valid-till dates and approval tracking.",
      highlights: [
        "Stage Tracking from Discovery to Closed-Won",
        "Full Rupee (₹) Currency Localization",
        "Instant Proposal Template Builder",
      ],
      previewStats: [
        { label: "Pipeline Value", val: "₹14.8Cr" },
        { label: "Win Rate", val: "68%" },
      ],
    },
    {
      id: "meetings",
      title: "Smart Meetings Scheduler",
      icon: Video,
      badge: "Virtual & On-site",
      tone: "from-violet-600 to-purple-600",
      description:
        "Schedule discovery calls and technical consultations. Interactive drawer details, video link integrations, and automated status logging.",
      highlights: [
        "Google Meet & Teams Link Integration",
        "Status Badges (Scheduled, Completed, Cancelled)",
        "Slide-out Meeting Detail Inspector",
      ],
      previewStats: [
        { label: "Meetings Completed", val: "380+" },
        { label: "Time Saved", val: "15 hrs/wk" },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Soft Warm Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-100/60 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-amber-100/50 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[150px]" />
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-amber-200/50 bg-[#FDFBF7]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 shadow-md shadow-indigo-600/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  EXIM NEXUS
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Export-Import Advisory Platform
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Page 1 vs Page 2) */}
          <div className="hidden md:flex items-center gap-1 rounded-full border border-amber-200/80 bg-white p-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab("hero")}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all",
                activeTab === "hero"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Globe size={14} />
              <span>Page 1: Hero Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all",
                activeTab === "features"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Layers size={14} />
              <span>Page 2: Product Showcase</span>
            </button>
          </div>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                >
                  <LayoutDashboard size={14} />
                  <span>Go to CRM Dashboard</span>
                </Link>
                <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-white px-3 py-1.5 shadow-sm">
                  <UserButton showName showAvatar />
                </div>
              </div>
            </SignedIn>

            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="rounded-xl border border-slate-300 bg-white px-4.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:shadow-lg transition hover:scale-[1.02]">
                    Get Started Free
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>

        {/* Mobile Sub-Page Selector */}
        <div className="flex md:hidden border-t border-amber-200/60 bg-white px-4 py-2 gap-2">
          <button
            onClick={() => setActiveTab("hero")}
            className={cn(
              "flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition",
              activeTab === "hero" ? "bg-indigo-600 text-white" : "text-slate-600 bg-slate-100"
            )}
          >
            Page 1: Hero
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={cn(
              "flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition",
              activeTab === "features" ? "bg-indigo-600 text-white" : "text-slate-600 bg-slate-100"
            )}
          >
            Page 2: Product Showcase
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* PAGE 1: HERO OVERVIEW */}
        {activeTab === "hero" && (
          <div className="space-y-16 animate-fade-in">
            {/* Main Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-4 py-1.5 text-xs font-semibold text-indigo-800 shadow-sm backdrop-blur-md">
                <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                <span>EXIM NEXUS Trade CRM v1.0</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight sm:leading-[1.1]">
                Transform Global Export & Import{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 bg-clip-text text-transparent">
                  Business Pipelines
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
                A modern trade advisory CRM designed for Indian exporters and importers. Manage buyer leads, track multi-million rupee (₹) trade contracts, schedule consultations, and generate compliant trade proposals.
              </p>

              {/* Call-to-Action Group */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <SignedIn>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition hover:scale-[1.02] hover:shadow-2xl"
                  >
                    <span>Launch CRM Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                </SignedIn>

                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition hover:scale-[1.02] hover:shadow-2xl">
                      <span>Get Started with Clerk</span>
                      <ArrowRight size={16} />
                    </button>
                  </SignUpButton>
                </SignedOut>

                <button
                  onClick={() => setActiveTab("features")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
                >
                  <BarChart3 size={16} className="text-indigo-600" />
                  <span>Explore Product Hub</span>
                </button>
              </div>

              {/* Calm Trust Metrics Bar */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
                {[
                  { label: "Trade Volume Managed", val: "₹50Cr+", icon: IndianRupee },
                  { label: "Lead Conversions", val: "3.4x Faster", icon: TrendingUp },
                  { label: "Trade Compliance", val: "99.8%", icon: ShieldCheck },
                  { label: "Active Enterprises", val: "250+ Co", icon: Building2 },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-amber-200/60 bg-white/90 p-4 shadow-sm backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2 text-indigo-600">
                      <m.icon size={16} />
                      <span className="text-xs font-semibold text-slate-500">
                        {m.label}
                      </span>
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-slate-900 tracking-tight">
                      {m.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Clean Mockup UI Showcase */}
            <div className="relative rounded-3xl border border-amber-200/70 bg-white p-4 sm:p-6 shadow-2xl shadow-indigo-100/60 max-w-5xl mx-auto overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-slate-500 font-medium">
                    exim-nexus-crm.internal / dashboard-preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    Live System Active
                  </span>
                </div>
              </div>

              {/* Clean Mockup Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mockup 1: Leads */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>Leads Pipeline</span>
                    <span className="text-indigo-600">120 Active</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Tata Exports", service: "DGFT Advisory", status: "Converted", price: "₹4.5L" },
                      { name: "Bajaj Global", service: "SEZ Clearance", status: "Interested", price: "₹2.8L" },
                      { name: "Wipro Customs", service: "Customs Audit", status: "New", price: "₹1.2L" },
                    ].map((l) => (
                      <div
                        key={l.name}
                        className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200/70 shadow-sm"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{l.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{l.service}</div>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup 2: Meetings */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>Upcoming Meetings</span>
                    <span className="text-emerald-600">Today</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: "DGFT Advisory Review", time: "10:30 AM", type: "Google Meet" },
                      { title: "Q3 Trade Consultation", time: "02:00 PM", type: "In-Person" },
                      { title: "SEZ Compliance Briefing", time: "04:30 PM", type: "Teams" },
                    ].map((m) => (
                      <div
                        key={m.title}
                        className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 border border-slate-200/70 shadow-sm"
                      >
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                          <Video size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-slate-900">
                            {m.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {m.time} · {m.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup 3: Revenue */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>Monthly Revenue (₹)</span>
                    <span className="text-emerald-600 font-bold">+18.4%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-sm text-center space-y-2">
                    <div className="text-2xl font-extrabold text-slate-900">₹48,50,000</div>
                    <div className="text-[11px] text-slate-500 font-medium">Closed & Realized Contracts</div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full w-[78%]" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold px-1">
                    <span>Target: ₹60L</span>
                    <span className="text-indigo-600">78% Achieved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: PRODUCT SHOWCASE SECTION */}
        {activeTab === "features" && (
          <div className="space-y-12 animate-fade-in pt-4">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                <Layers size={14} />
                <span>Page 2: Core Capability Modules</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
                Engineered for Global Trade Advisory
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Explore the key CRM modules built specifically for export-import operations.
              </p>
            </div>

            {/* Module Selector Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featureModules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveFeature(m.id)}
                  className={cn(
                    "flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all",
                    activeFeature === m.id
                      ? "border-indigo-500 bg-white shadow-xl shadow-indigo-100 ring-2 ring-indigo-500/20"
                      : "border-amber-200/60 bg-white/70 hover:bg-white hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md",
                      m.tone
                    )}
                  >
                    <m.icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{m.title}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{m.badge}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Module Detail Inspector */}
            {(() => {
              const current = featureModules.find((m) => m.id === activeFeature);
              if (!current) return null;
              return (
                <div className="rounded-3xl border border-amber-200/70 bg-white p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                      <current.icon size={14} />
                      <span>{current.badge}</span>
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {current.title}
                    </h3>

                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                      {current.description}
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Key Capabilities Included
                      </div>
                      {current.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-3 text-sm text-slate-800 font-medium">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <SignedIn>
                        <Link
                          to="/"
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
                        >
                          <span>Open Module in CRM</span>
                          <ArrowRight size={14} />
                        </Link>
                      </SignedIn>
                      <SignedOut>
                        <SignUpButton mode="modal">
                          <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition">
                            <span>Get Started</span>
                            <ArrowRight size={14} />
                          </button>
                        </SignUpButton>
                      </SignedOut>
                    </div>
                  </div>

                  {/* Module Feature Preview Card */}
                  <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold text-slate-700">
                        Module Metrics
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        ● Live State
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {current.previewStats.map((st) => (
                        <div
                          key={st.label}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="text-[11px] text-slate-500 font-medium">{st.label}</div>
                          <div className="text-xl font-extrabold text-slate-900 mt-1">
                            {st.val}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-xs text-indigo-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                        <Zap size={14} className="text-indigo-600" />
                        Integrated with Frontend State
                      </div>
                      <p className="text-[11px] text-indigo-800 font-medium">
                        All actions in this module are pre-wired and ready to sync with MongoDB backend endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
