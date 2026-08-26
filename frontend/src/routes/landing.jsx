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
  Building2,
  Users,
  FileText,
  CheckCircle2,
  LayoutDashboard,
  Star,
  Check,
  LayoutGrid,
  Calendar,
  PhoneCall,
  X,
  ChevronRight,
  Compass,
} from "lucide-react";
import crmHeroUi from "@/assets/Gemini_Generated_Image_jal9z9jal9z9jal9.png";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

export function LandingPage() {
  const { isSignedIn } = useUser();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoFormSubmitted, setDemoFormSubmitted] = useState(false);
  const [demoData, setDemoData] = useState({
    name: "",
    email: "",
    company: "",
    service: "DGFT Advisory & Licensing",
    notes: "",
  });

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoFormSubmitted(true);
    setTimeout(() => {
      setDemoFormSubmitted(false);
      setIsDemoModalOpen(false);
      setDemoData({
        name: "",
        email: "",
        company: "",
        service: "DGFT Advisory & Licensing",
        notes: "",
      });
    }, 2500);
  };

  // 6 Core Native CRM Features (Image 2 style, no AI)
  const crmFeatures = [
    {
      id: "pipeline",
      title: "Visual Workspaces",
      icon: LayoutGrid,
      description:
        "Organise projects into boards, lists, and timelines. Switch views without losing context — your trade team stays in sync.",
      link: "/deals",
      badge: "Deals & Stages",
    },
    {
      id: "leads",
      title: "Lead & Job Tracking",
      icon: Users,
      description:
        "Capture global buyer inquiries and assign DGFT, Customs, or SEZ consultation jobs. Inline status switching lets you update leads in one click.",
      link: "/leads",
      badge: "One-Click Status",
    },
    {
      id: "directory",
      title: "Enterprise Directory",
      icon: Building2,
      description:
        "Manage multiple key decision-makers per company account. Access GSTIN, IEC codes, executive designations, and one-click direct phone/email triggers.",
      link: "/companies",
      badge: "Multi-Contact CRM",
    },
    {
      id: "proposals",
      title: "Itemized Proposals",
      icon: FileText,
      description:
        "Generate professional trade proposals with valid-till dates, custom itemized service pricing, scope of work, and instant Word (.docx) export.",
      link: "/proposals",
      badge: "Docx & PDF Ready",
    },
    {
      id: "meetings",
      title: "Consultation Scheduler",
      icon: Calendar,
      description:
        "Schedule discovery calls and technical consultations with Google Meet and Teams integration. Log meeting notes and agendas directly into accounts.",
      link: "/meetings",
      badge: "Meet & Teams Sync",
    },
    {
      id: "services",
      title: "Advisory Services Catalog",
      icon: ShieldCheck,
      description:
        "Standardize advisory packages for Advance Authorisation, EPCG, RoDTEP, SEZ compliance, and Customs clearance with pre-configured fee templates.",
      link: "/services",
      badge: "DGFT & Customs",
    },
  ];

  const stats = [
    { label: "Trade Volume Managed", val: "₹50Cr+", change: "+42% YoY" },
    { label: "Lead Conversions", val: "3.4x Faster", change: "Verified" },
    { label: "Compliance Accuracy", val: "99.8%", change: "DGFT Ready" },
    { label: "Active Enterprises", val: "250+ Co", change: "Pan-India" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#191919] font-sans antialiased selection:bg-[#FF7A00] selection:text-white relative overflow-x-hidden">
      {/* Soft ambient background glow blobs matching Reference Design */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-[#FCE8D5]/60 blur-[130px]" />
        <div className="absolute top-1/2 -left-48 w-[600px] h-[600px] rounded-full bg-[#F6DFC8]/50 blur-[150px]" />
        <div className="absolute -bottom-40 right-1/4 w-[550px] h-[550px] rounded-full bg-[#FCE8D5]/50 blur-[140px]" />
      </div>

      {/* ======================= TOP NAVIGATION BAR ======================= */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EDE4D8]/70">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Geometric Spiral / Flower Star Logo */}
            <div className="w-8 h-8 text-black flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7 text-black"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a5 5 0 0 0 5 5 5 5 0 0 0 5-5" />
                <path d="M22 12a5 5 0 0 0-5 5 5 5 0 0 0 5 5" />
                <path d="M12 22a5 5 0 0 0-5-5 5 5 0 0 0-5 5" />
                <path d="M2 12a5 5 0 0 0 5-5 5 5 0 0 0-5-5" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-black">
                EXIM NEXUS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <a href="#hero" className="hover:text-black transition-colors">
              Platform
            </a>
            <a href="#features" className="hover:text-black transition-colors">
              Resources
            </a>
            <a href="#solutions" className="hover:text-black transition-colors">
              Solution
            </a>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="hover:text-black transition-colors text-left"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#18181B] text-white px-5 py-2.5 text-xs font-semibold hover:bg-black transition shadow-sm"
              >
                <LayoutDashboard size={14} />
                <span>Go to Dashboard</span>
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-[#EDE4D8] bg-white px-2 py-1 shadow-sm">
                <UserButton showName={false} />
              </div>
            </SignedIn>

            <SignedOut>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white px-5 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
              >
                Book demo
              </button>
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-black hover:scale-[1.02]">
                  <span>Get Started</span>
                  <ArrowRight size={13} />
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* ======================= HERO SECTION (IMAGE 1) ======================= */}
      <section id="hero" className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden">
        {/* Warm Organic Circle Glow behind Right Side (Matching Image 1) */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[-10%] w-[680px] h-[680px] lg:w-[850px] lg:h-[850px] rounded-full bg-[#FCE8D3]/75 -z-10 pointer-events-none blur-[1px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-5 space-y-7 text-left z-10">
              {/* Badge: New Feature Announcement */}
              <div className="inline-flex items-center gap-2.5 rounded-full bg-[#F5ECE0] border border-[#E9DAC8] px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                <span className="flex items-center gap-1 rounded-full bg-[#E5D4BE] px-2 py-0.5 text-[11px] font-bold text-slate-900">
                  <Star size={11} className="fill-slate-900 text-slate-900" /> New
                </span>
                <span className="text-slate-700 font-medium">
                  Trade CRM Platform is live
                </span>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              {/* Huge Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-950 leading-[1.1]">
                Where teams create and{" "}
                <span className="text-[#FF7A00]">achieve</span> more.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg font-normal">
                EXIM NEXUS is the all-in-one workspace that helps modern trade teams plan,
                collaborate, and deliver their best work faster.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <SignedIn>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-[#111827] text-white px-7 py-3.5 text-sm font-semibold shadow-md transition hover:bg-black hover:scale-[1.02]"
                  >
                    <span>Launch CRM Dashboard</span>
                    <ArrowRight size={15} />
                  </Link>
                </SignedIn>

                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#111827] text-white px-7 py-3.5 text-sm font-semibold shadow-md transition hover:bg-black hover:scale-[1.02]">
                      <span>Start for free</span>
                      <ArrowRight size={15} />
                    </button>
                  </SignUpButton>
                </SignedOut>

                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
                >
                  Talk to sales
                </button>
              </div>

              {/* Social Proof Bar */}
              <div className="pt-2 flex items-center gap-4">
                {/* Overlapping User Avatars */}
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 mt-0.5">
                    Used by 1,000+ people
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Large CRM Dashboard Mockup stuck to right screen side */}
            <div className="lg:col-span-7 relative lg:-mr-12 xl:-mr-28 2xl:-mr-44 lg:translate-x-4">
              <div className="relative rounded-2xl sm:rounded-3xl lg:rounded-r-none bg-white shadow-2xl shadow-stone-900/15 overflow-hidden">
                {/* Embedded Uploaded CRM Dashboard Screenshot (cropped & scaled cleanly) */}
                <div className="relative bg-white w-full overflow-hidden">
                  <img
                    src={crmHeroUi}
                    alt="EXIM CRM Dashboard Interface"
                    className="w-full h-[360px] sm:h-[480px] md:h-[540px] lg:h-[600px] xl:h-[660px] object-cover object-left-top block select-none scale-[1.02] origin-top-left"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= STATS / TRUST METRICS STRIP ======================= */}
      <section id="stats" className="border-y border-[#EDE4D8]/80 bg-white/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {s.val}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700">
                  {s.label}
                </div>
                <div className="text-[11px] font-medium text-[#FF7A00]">
                  {s.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= FEATURES GRID SECTION (IMAGE 2) ======================= */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
              Built for modern <span className="text-[#FF7A00]">teams</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              EXIM NEXUS brings together DGFT advisory, buyer pipeline management, trade documentation, and meetings — so your team can focus on delivering great work instead of managing tools.
            </p>
          </div>

          {/* 6 Feature Cards Grid (3 Columns x 2 Rows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {crmFeatures.map((f) => (
              <div
                key={f.id}
                className="group relative rounded-3xl border border-[#EDE4D8] bg-white p-7 sm:p-8 transition-all duration-300 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-950/5 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Orange Outline Icon */}
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl border border-orange-200/90 bg-orange-50/70 text-[#FF7A00] mb-6 shadow-sm group-hover:scale-105 transition-transform">
                    <f.icon size={22} strokeWidth={2} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-950 mb-3 tracking-tight">
                    {f.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {f.description}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {f.badge}
                  </span>
                  <SignedIn>
                    <Link
                      to={f.link}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FF7A00] hover:text-orange-700 transition"
                    >
                      <span>Explore</span>
                      <ChevronRight size={13} />
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <button className="inline-flex items-center gap-1 text-xs font-bold text-[#FF7A00] hover:text-orange-700 transition">
                        <span>Get Started</span>
                        <ChevronRight size={13} />
                      </button>
                    </SignUpButton>
                  </SignedOut>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= SOLUTIONS / ADVISORY WORKFLOW ======================= */}
      <section id="solutions" className="py-16 sm:py-24 bg-white/70 border-t border-[#EDE4D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="rounded-3xl border border-[#EDE4D8] bg-[#FAF7F2] p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/70 border border-orange-200 px-3.5 py-1 text-xs font-bold text-orange-800">
                  <Compass size={13} />
                  <span>End-to-End Trade Lifecycle</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  Seamless DGFT, Customs & International Trade Execution
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Whether assisting first-time exporters or managing multi-crore EPCG authorizations, EXIM NEXUS unifies all advisory touchpoints under one reliable system.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    "DGFT Schemes (EPCG, Advance Authorisation, RoDTEP, RoSCTL)",
                    "Customs Clearance & Duty Drawback management",
                    "SEZ / EOU Unit onboarding and compliance filings",
                    "Executive meetings with instant calendar sync and minutes logging",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-800 font-medium">
                      <CheckCircle2 size={17} className="text-[#FF7A00] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    onClick={() => setIsDemoModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#111827] text-white px-6 py-3 text-xs font-semibold shadow-md transition hover:bg-black"
                  >
                    <span>Schedule Free Demo Consultation</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Visual Workflow Steps Card */}
              <div className="lg:col-span-6 space-y-3.5">
                {[
                  {
                    step: "01",
                    title: "Lead Ingestion & Qualification",
                    desc: "Capture trade leads from international buyer queries and qualify service requirements in seconds.",
                  },
                  {
                    step: "02",
                    title: "Itemized Proposal & Quotation",
                    desc: "Generate professional Word (.docx) proposals with custom fee structures and terms of trade.",
                  },
                  {
                    step: "03",
                    title: "Pipeline & Contract Execution",
                    desc: "Track stage progression in real-time until closed-won, with localized INR revenue realization metrics.",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className="rounded-2xl border border-[#EDE4D8] bg-white p-5 shadow-sm flex items-start gap-4"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-50 border border-orange-200 text-[#FF7A00] font-extrabold text-sm flex items-center justify-center">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= CTA BANNER ======================= */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="relative rounded-3xl bg-[#111827] text-white p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
            {/* Background ambient light */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#FF7A00]/20 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to accelerate your global trade operations?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Join forward-thinking exporters, importers, and trade advisory firms using EXIM NEXUS.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <SignedIn>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-[#FF7A00] text-white px-7 py-3.5 text-sm font-bold shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition hover:scale-[1.02]"
                  >
                    <span>Open CRM Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                </SignedIn>
                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#FF7A00] text-white px-7 py-3.5 text-sm font-bold shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition hover:scale-[1.02]">
                      <span>Get Started for Free</span>
                      <ArrowRight size={16} />
                    </button>
                  </SignUpButton>
                </SignedOut>

                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  <PhoneCall size={14} />
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= COMPREHENSIVE FOOTER ======================= */}
      <footer className="border-t border-[#EDE4D8] bg-[#FAF7F2] pt-14 pb-10 text-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 text-black flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-black"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2a5 5 0 0 0 5 5 5 5 0 0 0 5-5" />
                    <path d="M22 12a5 5 0 0 0-5 5 5 5 0 0 0 5 5" />
                    <path d="M12 22a5 5 0 0 0-5-5 5 5 0 0 0-5 5" />
                    <path d="M2 12a5 5 0 0 0 5-5 5 5 0 0 0-5-5" />
                  </svg>
                </div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  EXIM NEXUS
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                The comprehensive trade advisory CRM and operational workspace designed specifically for export-import teams and DGFT consultants.
              </p>
              <div className="pt-2 flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  All Systems Operational
                </span>
                <span>•</span>
                <span>v1.2 Production</span>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Product Modules
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/leads" className="hover:text-black transition-colors">
                    Buyer & Leads CRM
                  </Link>
                </li>
                <li>
                  <Link to="/deals" className="hover:text-black transition-colors">
                    Visual Trade Pipeline
                  </Link>
                </li>
                <li>
                  <Link to="/companies" className="hover:text-black transition-colors">
                    Company Directory
                  </Link>
                </li>
                <li>
                  <Link to="/proposals" className="hover:text-black transition-colors">
                    Proposals Builder
                  </Link>
                </li>
                <li>
                  <Link to="/meetings" className="hover:text-black transition-colors">
                    Meetings Scheduler
                  </Link>
                </li>
              </ul>
            </div>

            {/* Solutions Links */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Solutions
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/services" className="hover:text-black transition-colors">
                    DGFT Authorizations
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-black transition-colors">
                    Customs Compliance
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-black transition-colors">
                    SEZ / EOU Setups
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-black transition-colors">
                    Export Incentive Schemes
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-black transition-colors">
                    Trade Finance & GST
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources & Legal */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Company & Support
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setIsDemoModalOpen(true)}
                    className="hover:text-black transition-colors text-left"
                  >
                    Request Demo
                  </button>
                </li>
                <li>
                  <a href="#hero" className="hover:text-black transition-colors">
                    About EXIM NEXUS
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-black transition-colors">
                    Security & Privacy
                  </a>
                </li>
                <li>
                  <a href="#stats" className="hover:text-black transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="border-t border-[#EDE4D8] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} EXIM NEXUS Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#hero" className="hover:text-slate-800 transition">
                Privacy Policy
              </a>
              <a href="#hero" className="hover:text-slate-800 transition">
                Security Architecture
              </a>
              <a href="#hero" className="hover:text-slate-800 transition">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================= BOOK DEMO / TALK TO SALES MODAL ======================= */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#EDE4D8] bg-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition"
            >
              <X size={18} />
            </button>

            {demoFormSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto">
                  <Check size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Demo Request Received!
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Our EXIM advisory consultant will reach out within 2 hours to confirm your custom walkthrough session.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700 mb-2">
                    <Sparkles size={12} /> Personalized Walkthrough
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Book a Platform Demo
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Discover how EXIM NEXUS streamlines your export-import advisory pipeline.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={demoData.name}
                      onChange={(e) =>
                        setDemoData({ ...demoData, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@enterpriseglobal.in"
                      value={demoData.email}
                      onChange={(e) =>
                        setDemoData({ ...demoData, email: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Global Exim Logistics"
                      value={demoData.company}
                      onChange={(e) =>
                        setDemoData({ ...demoData, company: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Advisory Focus
                    </label>
                    <select
                      value={demoData.service}
                      onChange={(e) =>
                        setDemoData({ ...demoData, service: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                    >
                      <option>DGFT Advisory & Licensing</option>
                      <option>Customs Clearance & Audit</option>
                      <option>SEZ / EOU Unit Onboarding</option>
                      <option>Export Lead & Proposal Management</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#111827] py-3 text-xs font-bold text-white shadow-md transition hover:bg-black"
                  >
                    Confirm Demo Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
