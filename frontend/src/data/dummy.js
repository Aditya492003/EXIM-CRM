const firstNames = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Neha", "Arjun", "Isha", "Karan", "Meera", "Rahul", "Sneha", "Aditya", "Kavya", "Nikhil", "Diya", "Sameer", "Riya", "Yash", "Pooja", "Manish", "Tara", "Dev", "Simran", "Kabir", "Anjali", "Varun", "Nisha", "Raj", "Zara"];
const lastNames = ["Sharma", "Patel", "Verma", "Kumar", "Reddy", "Gupta", "Singh", "Iyer", "Mehta", "Kapoor", "Nair", "Rao", "Malhotra", "Joshi", "Desai"];
const companies = ["Meridian Trade Co.", "Orion Exports", "Zenith Global", "Northwind Logistics", "Silverline Imports", "Apex Commerce", "Cedar & Co.", "Blueharbor Freight", "Ivory Traders", "Vanguard Shipping", "Summit Cargo", "Aurora Exim", "Kestrel Group", "Pacific Rim Traders", "Ironwood Industries", "Delta Bay Exports", "Halcyon Trade", "Monsoon Merchants", "Terra Nova Logistics", "Crestwave Global"];
const industries = ["Textiles", "Electronics", "Pharmaceuticals", "Agriculture", "Automotive", "Chemicals", "Machinery", "Food & Beverage", "Metals", "Consumer Goods"];
const sources = ["Website", "Referral", "LinkedIn", "Cold Call", "Trade Show", "Email Campaign", "Partner", "Google Ads"];
const statuses = ["New", "Contacted", "Interested", "Proposal Sent", "Negotiation", "Converted", "Lost", "Inactive"];

function seed(i) {
  return ((i * 9301 + 49297) % 233280) / 233280;
}
function pick(arr, i, o = 0) {
  return arr[Math.floor(seed(i + o) * arr.length)];
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const servicesList = [
  { id: "S-101", name: "DGFT Advance Authorization", category: "DGFT Advisory", price: "₹45,000", activeLeads: 12, completedJobs: 84, status: "Active", description: "Duty-free import of inputs physically incorporated into export products." },
  { id: "S-102", name: "EPCG License", category: "Capital Goods", price: "₹60,000", activeLeads: 8, completedJobs: 56, status: "Active", description: "Import of capital goods at zero customs duty for export production." },
  { id: "S-103", name: "RoDTEP Claim & Refund", category: "Export Benefit", price: "₹25,000", activeLeads: 15, completedJobs: 110, status: "Active", description: "Remission of Duties and Taxes on Exported Products reimbursement." },
  { id: "S-104", name: "IEC Registration & Update", category: "Compliance", price: "₹10,000", activeLeads: 6, completedJobs: 210, status: "Active", description: "Import Export Code registration, modification, and annual updates." },
  { id: "S-105", name: "SEZ & FTWZ Advisory", category: "Special Economic Zones", price: "₹1,20,000", activeLeads: 5, completedJobs: 32, status: "Active", description: "Setup, compliance, and tax incentives for SEZ & Free Trade Warehousing Units." },
  { id: "S-106", name: "Customs Duty Refund & Drawback", category: "Customs Clearance", price: "₹50,000", activeLeads: 9, completedJobs: 65, status: "Active", description: "Duty drawback claims, excess customs duty refund processing." },
  { id: "S-107", name: "AEO Certification T1/T2/T3", category: "Customs Certification", price: "₹1,50,000", activeLeads: 4, completedJobs: 24, status: "Active", description: "Authorized Economic Operator certification for faster customs clearance." },
  { id: "S-108", name: "Export Documentation Audit", category: "Audit & Legal", price: "₹35,000", activeLeads: 7, completedJobs: 48, status: "Active", description: "Comprehensive audit of shipping bills, eBRC, bank realizations and DGFT filings." },
];

const serviceNames = servicesList.map((s) => s.name);

export const leads = Array.from({ length: 50 }, (_, i) => {
  const first = pick(firstNames, i, 1);
  const last = pick(lastNames, i, 2);
  const co = pick(companies, i, 3);
  return {
    id: `L-${1000 + i}`,
    name: `${first} ${last}`,
    company: co,
    phone: `+91 ${90000 + Math.floor(seed(i + 4) * 9999)} ${10000 + Math.floor(seed(i + 5) * 89999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${co.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.com`,
    service: pick(serviceNames, i, 12),
    source: pick(sources, i, 6),
    assignedTo: "Unassigned",
    status: pick(statuses, i, 8),
    createdDate: daysAgo(Math.floor(seed(i + 9) * 60)),
    lastContacted: daysAgo(Math.floor(seed(i + 10) * 20)),
    nextFollowUp: daysAhead(Math.floor(seed(i + 11) * 14) - 3),
  };
});

export const companiesData = Array.from({ length: 20 }, (_, i) => {
  const name = companies[i % companies.length];
  const contact = `${pick(firstNames, i, 20)} ${pick(lastNames, i, 21)}`;
  const active = Math.floor(seed(i + 30) * 6) + 1;
  return {
    id: `C-${2000 + i}`,
    name,
    industry: pick(industries, i, 22),
    primaryContact: contact,
    phone: `+91 ${90000 + Math.floor(seed(i + 23) * 9999)} ${10000 + Math.floor(seed(i + 24) * 89999)}`,
    email: `contact@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.com`,
    assignedManager: "Unassigned",
    activeDeals: active,
    createdDate: daysAgo(Math.floor(seed(i + 26) * 200)),
    status: ["Active", "Inactive", "Prospect"][Math.floor(seed(i + 27) * 3)],
    revenue: Math.floor(seed(i + 28) * 5000000) + 100000,
    wonDeals: Math.floor(seed(i + 29) * 12),
    openDeals: active,
    lostDeals: Math.floor(seed(i + 31) * 5),
  };
});

const designations = ["Export Manager", "Purchase Head", "Managing Director", "Logistics Lead", "Customs Compliance Head", "VP International Trade", "Finance Director"];

export const contactsData = Array.from({ length: 30 }, (_, i) => {
  const first = pick(firstNames, i, 50);
  const last = pick(lastNames, i, 51);
  const co = pick(companies, i, 52);
  return {
    id: `CT-${100 + i}`,
    name: `${first} ${last}`,
    company: co,
    phone: `+91 ${90000 + Math.floor(seed(i + 53) * 9999)} ${10000 + Math.floor(seed(i + 54) * 89999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${co.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.com`,
    designation: pick(designations, i, 55),
    createdDate: daysAgo(Math.floor(seed(i + 56) * 120)),
  };
});

const dealStages = ["New", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const priorities = ["Low", "Medium", "High"];
const dealNames = ["Q3 Textile Export", "Pharma Bulk Order", "Electronics Shipment", "Auto Parts Deal", "Chemical Supply Contract", "Agri Produce Export", "Machinery Import", "Cotton Bales Order", "Steel Coil Contract", "Rice Export Batch", "Coffee Beans Shipment", "Spice Trade Deal", "Leather Goods Order", "Solar Panels Import"];

export const deals = Array.from({ length: 30 }, (_, i) => ({
  id: `D-${3000 + i}`,
  name: `${pick(dealNames, i, 40)} #${i + 1}`,
  company: pick(companies, i, 41),
  value: Math.floor(seed(i + 42) * 900000) + 50000,
  owner: "Unassigned",
  expectedClose: daysAhead(Math.floor(seed(i + 44) * 90)),
  priority: pick(priorities, i, 45),
  stage: pick(dealStages, i, 46),
}));

export const activities = [
  { id: "a1", type: "lead", title: "New lead created", subtitle: "Aarav Sharma — Meridian Trade Co.", time: "5m ago", actor: "System" },
  { id: "a2", type: "deal", title: "Deal moved to Negotiation", subtitle: "Pharma Bulk Order — $124,500", time: "22m ago", actor: "System" },
  { id: "a3", type: "meeting", title: "Meeting scheduled", subtitle: "With Priya Patel · Tomorrow 3:00 PM", time: "1h ago", actor: "System" },
  { id: "a4", type: "proposal", title: "Proposal sent", subtitle: "Q3 Textile Export — Orion Exports", time: "3h ago", actor: "System" },
  { id: "a5", type: "company", title: "New company added", subtitle: "Halcyon Trade", time: "5h ago", actor: "System" },
  { id: "a6", type: "call", title: "Call logged", subtitle: "Rohan Verma — 12 min", time: "Yesterday", actor: "System" },
  { id: "a7", type: "email", title: "Email opened", subtitle: "Follow-up · Vanguard Shipping", time: "Yesterday", actor: "System" },
  { id: "a8", type: "note", title: "Note added", subtitle: "Client wants revised pricing by Friday", time: "2d ago", actor: "System" },
];

export const tasks = [
  { id: "t1", title: "Follow up with Ananya Reddy", due: "Today 2:00 PM", type: "followup", overdue: false },
  { id: "t2", title: "Send proposal to Zenith Global", due: "Today 5:00 PM", type: "task", overdue: false },
  { id: "t3", title: "Call Vikram Gupta", due: "Yesterday", type: "call", overdue: true },
  { id: "t4", title: "Meeting: Orion Exports Q3 review", due: "Tomorrow 11:00 AM", type: "meeting", overdue: false },
  { id: "t5", title: "Contract review — Ironwood Industries", due: "2 days ago", type: "task", overdue: true },
];

export const leadGrowth = [
  { month: "Jan", leads: 32 }, { month: "Feb", leads: 41 }, { month: "Mar", leads: 38 },
  { month: "Apr", leads: 52 }, { month: "May", leads: 61 }, { month: "Jun", leads: 58 },
  { month: "Jul", leads: 74 }, { month: "Aug", leads: 82 }, { month: "Sep", leads: 79 },
  { month: "Oct", leads: 95 }, { month: "Nov", leads: 108 }, { month: "Dec", leads: 121 },
];

export const leadSources = [
  { name: "Website", value: 32 },
  { name: "Referral", value: 24 },
  { name: "LinkedIn", value: 18 },
  { name: "Trade Show", value: 14 },
  { name: "Email", value: 8 },
  { name: "Other", value: 4 },
];

export const dealsByStage = dealStages.map((s) => ({
  stage: s,
  count: deals.filter((d) => d.stage === s).length,
}));

export const monthlyRevenue = [
  { month: "Jan", revenue: 145000 }, { month: "Feb", revenue: 168000 },
  { month: "Mar", revenue: 152000 }, { month: "Apr", revenue: 189000 },
  { month: "May", revenue: 214000 }, { month: "Jun", revenue: 232000 },
  { month: "Jul", revenue: 258000 }, { month: "Aug", revenue: 285000 },
  { month: "Sep", revenue: 271000 }, { month: "Oct", revenue: 312000 },
  { month: "Nov", revenue: 348000 }, { month: "Dec", revenue: 392000 },
];

export const performance = [];

export const statusColors = {
  New: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
  Contacted: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
  Interested: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  "Proposal Sent": "bg-cyan-100 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30",
  Negotiation: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30",
  Converted: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  Lost: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30",
};

export const stageColors = {
  New: "border-blue-200 bg-blue-50/60 dark:bg-blue-500/5 dark:border-blue-500/30",
  Qualified: "border-violet-200 bg-violet-50/60 dark:bg-violet-500/5 dark:border-violet-500/30",
  "Proposal Sent": "border-cyan-200 bg-cyan-50/60 dark:bg-cyan-500/5 dark:border-cyan-500/30",
  Negotiation: "border-amber-200 bg-amber-50/60 dark:bg-amber-500/5 dark:border-amber-500/30",
  Won: "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-500/5 dark:border-emerald-500/30",
  Lost: "border-rose-200 bg-rose-50/60 dark:bg-rose-500/5 dark:border-rose-500/30",
};

export function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function avatarColor(name) {
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

export const totals = {
  totalLeads: leads.length,
  newLeadsToday: 7,
  activeCompanies: companiesData.filter((c) => c.status === "Active").length,
  openDeals: deals.filter((d) => !["Won", "Lost"].includes(d.stage)).length,
  closingThisMonth: 9,
  pipelineRevenue: deals.filter((d) => !["Won", "Lost"].includes(d.stage)).reduce((s, d) => s + d.value, 0),
};

const proposalServices = [
  "DGFT · Advance Authorization",
  "EPCG License",
  "MEIS / RoDTEP Claim",
  "IEC Registration",
  "SEZ Advisory",
  "Customs Duty Refund",
  "AEO Certification",
  "Export Documentation",
];
const proposalStatuses = ["Draft", "Sent", "Under Review", "Approved", "Rejected", "Expired"];
const billingModes = ["Fixed Fee", "Retainer", "Milestone", "Success Fee"];
const templates = ["Built-in PDF", "Modern Corporate", "Minimal", "Government Filing", "Detailed Scope"];

export const proposals = Array.from({ length: 24 }, (_, i) => {
  const svc = pick(proposalServices, i, 70);
  return {
    id: `P-${4000 + i}`,
    number: `ASC/2026-27/${String(180 + i).padStart(5, "0")}`,
    title: `${svc} — ${pick(companies, i, 71)}`,
    client: pick(companies, i, 71),
    contact: `${pick(firstNames, i, 72)} ${pick(lastNames, i, 73)}`,
    service: svc,
    value: Math.floor(seed(i + 74) * 900000) + 50000,
    billing: billingModes[Math.floor(seed(i + 75) * billingModes.length)],
    status: pick(proposalStatuses, i, 76),
    owner: "Unassigned",
    createdDate: daysAgo(Math.floor(seed(i + 78) * 45)),
    validTill: daysAhead(Math.floor(seed(i + 79) * 45) + 5),
    template: pick(templates, i, 80),
  };
});

export const proposalTemplates = [
  { id: "T-1", name: "Built-in PDF", description: "Standard advisory proposal — cover, scope, fees, T&C.", category: "General", format: "PDF", updatedAt: daysAgo(3), usedCount: 42, status: "Published" },
  { id: "T-2", name: "Modern Corporate", description: "Cleaner typography for enterprise clients.", category: "General", format: "PDF", updatedAt: daysAgo(9), usedCount: 18, status: "Published" },
  { id: "T-3", name: "Government Filing", description: "Matches DGFT/Customs filing tone with annexures.", category: "Government", format: "DOCX", updatedAt: daysAgo(14), usedCount: 27, status: "Published" },
  { id: "T-4", name: "Minimal", description: "One-page summary for retainer renewals.", category: "Retainer", format: "PDF", updatedAt: daysAgo(21), usedCount: 11, status: "Published" },
  { id: "T-5", name: "Detailed Scope v2", description: "Long-form scope with milestone billing schedule.", category: "Milestone", format: "DOCX", updatedAt: daysAgo(2), usedCount: 4, status: "Draft" },
];

export const proposalStatusColors = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30",
  Sent: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
  "Under Review": "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  Approved: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  Rejected: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
  Expired: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30",
};

export const proposalTotals = {
  total: proposals.length,
  approved: proposals.filter((p) => p.status === "Approved").length,
  underReview: proposals.filter((p) => p.status === "Under Review").length,
  pipelineValue: proposals.filter((p) => !["Rejected", "Expired"].includes(p.status)).reduce((s, p) => s + p.value, 0),
  winRate: Math.round(
    (proposals.filter((p) => p.status === "Approved").length /
      Math.max(1, proposals.filter((p) => ["Approved", "Rejected"].includes(p.status)).length)) * 100,
  ),
};
