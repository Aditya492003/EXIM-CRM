# 🌐 Exim Nexus CRM — Full Project Documentation

> **Export-Import Trade CRM Platform** | React + Vite + TanStack Router | Ready for MongoDB + Express Backend

---

## 📦 Project Status: Frontend Complete ✅

All pages are fully built with interactive UI, state management, modals, filters, inline edits, and data tables. The frontend uses **local mock data** (`src/data/dummy.js`) and is ready to be wired to a real backend API.

---

## 🗂️ Project Structure

```
exim-nexus-crm/
├── frontend/                        ← React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx    ← Main layout wrapper
│   │   │   │   └── Sidebar.jsx      ← Navigation sidebar
│   │   │   └── crm/
│   │   │       ├── UserAvatar.jsx   ← Avatar with initials
│   │   │       └── StatusBadge.jsx  ← Colored status pill
│   │   ├── data/
│   │   │   └── dummy.js             ← All mock data (replace with API calls)
│   │   ├── lib/
│   │   │   └── utils.js             ← cn() helper (clsx + tw-merge)
│   │   ├── routes/
│   │   │   ├── index.jsx            ← Dashboard
│   │   │   ├── leads.jsx            ← Leads management
│   │   │   ├── contacts.jsx         ← Contacts management
│   │   │   ├── meetings.jsx         ← Meetings management
│   │   │   ├── companies.jsx        ← Companies management
│   │   │   ├── deals.jsx            ← Deals / pipeline
│   │   │   ├── services.jsx         ← Services catalog
│   │   │   ├── proposals.index.jsx  ← Proposals list
│   │   │   ├── proposals.new.jsx    ← Create proposal
│   │   │   └── proposals.templates.jsx ← Proposal templates
│   │   ├── routeTree.gen.js         ← TanStack Router tree
│   │   ├── router.jsx               ← Router setup
│   │   ├── main.jsx                 ← App entry point
│   │   └── styles.css               ← Global styles + CSS tokens
│   ├── .env                         ← Frontend env variables (gitignored)
│   ├── .env.example                 ← Template for env setup
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
│
└── backend/                         ← Node.js + Express (TO BUILD)
    ├── src/
    │   ├── config/
    │   │   └── db.js                ← MongoDB connection
    │   ├── models/                  ← Mongoose schemas
    │   │   ├── Lead.js
    │   │   ├── Contact.js
    │   │   ├── Company.js
    │   │   ├── Deal.js
    │   │   ├── Meeting.js
    │   │   ├── Service.js
    │   │   ├── Proposal.js
    │   │   └── User.js
    │   ├── routes/                  ← Express routers
    │   │   ├── leads.js
    │   │   ├── contacts.js
    │   │   ├── companies.js
    │   │   ├── deals.js
    │   │   ├── meetings.js
    │   │   ├── services.js
    │   │   ├── proposals.js
    │   │   └── auth.js
    │   ├── middleware/
    │   │   ├── auth.js              ← JWT verification
    │   │   └── errorHandler.js
    │   └── index.js                 ← Express app entry
    ├── .env                         ← Backend secrets (gitignored)
    ├── .env.example
    ├── .gitignore
    └── package.json
```

---

## 🖥️ Pages Built — Frontend Progress

| Page | Route | Features |
|---|---|---|
| **Dashboard** | `/` | KPI cards, Lead Growth chart, Deals by Stage, Monthly Revenue (₹), Lead Sources pie, Recent Leads, Top Companies, Team Performance, Quick Actions |
| **Leads** | `/leads` | Full table with column toggle, search, status/source/service filters, quick filters, pagination, favorites, inline **editable status dropdown**, detail drawer, Add/Edit modal (with Service field), Export CSV, Import |
| **Contacts** | `/contacts` | Company-linked contacts, search, **Company filter dropdown**, Add/Edit modal (Name, Company select, Phone, Email, Designation), Export CSV |
| **Meetings** | `/meetings` | KPI cards, search, status filter pills, meeting table with inline **status select**, detail drawer, Add/Edit modal (Title, Type, Mode, Date/Time/Duration, Link, Notes), Join link |
| **Companies** | `/companies` | Company accounts table, status tabs (Active/Prospect/Inactive), filter drawer (Industry/Manager), Add/Edit modal, Export CSV, Import |
| **Deals** | `/deals` | Deal pipeline, stage/priority filters, search, Add/Edit modal, deal detail drawer |
| **Services** | `/services` | Services catalog, category filter tabs, search, Add/Edit modal |
| **Proposals** | `/proposals` | Proposal list, status filter, value summary, detail view |
| **Proposal Builder** | `/proposals/new` | Multi-section proposal creator |
| **Templates** | `/proposals/templates` | Reusable proposal templates |

---

## 🛢️ Database Schema — MongoDB Collections

### 1. `leads` Collection

```js
{
  _id: ObjectId,
  name: String,               // Full name of lead
  company: String,            // Company name
  companyId: ObjectId,        // → ref: 'Company'
  phone: String,
  email: String,
  service: String,            // Service/Job linked
  serviceId: ObjectId,        // → ref: 'Service'
  source: {
    type: String,
    enum: ["Website","Referral","Cold Call","LinkedIn","Exhibition","Email Campaign"]
  },
  assignedTo: String,
  assignedUserId: ObjectId,   // → ref: 'User'
  status: {
    type: String,
    enum: ["New","Contacted","Interested","Proposal Sent","Negotiation","Converted","Lost","Inactive"],
    default: "New"
  },
  notes: String,
  isFavorite: { type: Boolean, default: false },
  createdDate: { type: Date, default: Date.now },
  lastContacted: Date,
  nextFollowUp: Date
}
```

### 2. `contacts` Collection

```js
{
  _id: ObjectId,
  name: String,
  company: String,
  companyId: ObjectId,        // → ref: 'Company'
  phone: String,
  email: String,
  designation: String,        // e.g. "Export Manager", "Purchase Head"
  notes: String,
  createdDate: { type: Date, default: Date.now }
}
```

### 3. `companies` Collection

```js
{
  _id: ObjectId,
  name: String,
  industry: String,
  primaryContact: String,
  primaryContactId: ObjectId, // → ref: 'Contact'
  phone: String,
  email: String,
  assignedManager: String,
  assignedManagerId: ObjectId,// → ref: 'User'
  status: {
    type: String,
    enum: ["Active","Inactive","Prospect"],
    default: "Active"
  },
  revenue: Number,            // Total revenue in ₹
  activeDeals: { type: Number, default: 0 },
  wonDeals: { type: Number, default: 0 },
  openDeals: { type: Number, default: 0 },
  lostDeals: { type: Number, default: 0 },
  website: String,
  address: String,
  gstin: String,              // GST Identification Number
  pan: String,
  notes: String,
  createdDate: { type: Date, default: Date.now }
}
```

### 4. `deals` Collection

```js
{
  _id: ObjectId,
  name: String,               // Deal title
  company: String,
  companyId: ObjectId,        // → ref: 'Company'
  leadId: ObjectId,           // → ref: 'Lead'
  contactId: ObjectId,        // → ref: 'Contact'
  value: Number,              // Deal value in ₹
  stage: {
    type: String,
    enum: ["New","Qualified","Proposal Sent","Negotiation","Won","Lost"],
    default: "New"
  },
  priority: {
    type: String,
    enum: ["Low","Medium","High"],
    default: "Medium"
  },
  assignedTo: String,
  assignedUserId: ObjectId,   // → ref: 'User'
  service: String,
  serviceId: ObjectId,        // → ref: 'Service'
  expectedCloseDate: Date,
  closedDate: Date,
  notes: String,
  createdDate: { type: Date, default: Date.now }
}
```

### 5. `meetings` Collection

```js
{
  _id: ObjectId,
  title: String,
  type: {
    type: String,
    enum: ["Discovery Call","Follow-up","Proposal Presentation","QBR","Demo","Negotiation","Closure"]
  },
  company: String,
  companyId: ObjectId,        // → ref: 'Company'
  attendee: String,
  contactId: ObjectId,        // → ref: 'Contact'
  mode: String,               // "Virtual (Google Meet)" | "In-Person (Client Office)" etc.
  date: Date,
  time: String,               // "10:00"
  duration: String,           // "1 hour"
  status: {
    type: String,
    enum: ["Scheduled","Completed","Cancelled","Rescheduled"],
    default: "Scheduled"
  },
  link: String,               // Virtual meeting URL
  notes: String,
  organizedBy: ObjectId,      // → ref: 'User'
  createdDate: { type: Date, default: Date.now }
}
```

### 6. `services` Collection

```js
{
  _id: ObjectId,
  name: String,
  category: {
    type: String,
    enum: ["DGFT Advisory","Capital Goods","Export Benefit","Compliance","Special Economic Zones","Customs Clearance","Customs Certification","Audit & Legal"]
  },
  description: String,
  price: Number,              // Base price in ₹
  duration: String,           // e.g. "3-4 weeks"
  status: {
    type: String,
    enum: ["Active","Inactive"],
    default: "Active"
  },
  features: [String],
  createdDate: { type: Date, default: Date.now }
}
```

### 7. `proposals` Collection

```js
{
  _id: ObjectId,
  number: String,             // e.g. "PRO-2024-001"
  client: String,
  clientId: ObjectId,         // → ref: 'Company'
  contactId: ObjectId,        // → ref: 'Contact'
  service: String,
  serviceId: ObjectId,        // → ref: 'Service'
  value: Number,              // Proposal value in ₹
  status: {
    type: String,
    enum: ["Draft","Under Review","Approved","Rejected","Expired"],
    default: "Draft"
  },
  validTill: Date,
  sections: [{
    title: String,
    content: String
  }],
  templateId: ObjectId,
  createdBy: ObjectId,        // → ref: 'User'
  createdDate: { type: Date, default: Date.now },
  sentDate: Date,
  approvedDate: Date
}
```

### 8. `users` Collection

```js
{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true },
  password: String,           // bcrypt hashed — NEVER store plain text
  role: {
    type: String,
    enum: ["admin","manager","sales"],
    default: "sales"
  },
  avatar: String,             // URL or base64
  phone: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdDate: { type: Date, default: Date.now }
}
```

---

## 🔌 REST API Endpoints Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login            → returns JWT token
GET    /api/auth/me               → get logged in user
POST   /api/auth/logout
PUT    /api/auth/change-password
```

### Leads
```
GET    /api/leads                 ?search=&status=&source=&assignedTo=&page=1&limit=10
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
PATCH  /api/leads/:id/status      { "status": "Converted" }
DELETE /api/leads/:id
GET    /api/leads/export/csv
POST   /api/leads/import/csv      multipart/form-data
```

### Contacts
```
GET    /api/contacts              ?company=&search=
POST   /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
DELETE /api/contacts/:id
```

### Companies
```
GET    /api/companies             ?status=&industry=&manager=
POST   /api/companies
GET    /api/companies/:id
PUT    /api/companies/:id
DELETE /api/companies/:id
GET    /api/companies/export/csv
POST   /api/companies/import/csv
```

### Deals
```
GET    /api/deals                 ?stage=&priority=&assignedTo=
POST   /api/deals
GET    /api/deals/:id
PUT    /api/deals/:id
PATCH  /api/deals/:id/stage       { "stage": "Won" }
DELETE /api/deals/:id
```

### Meetings
```
GET    /api/meetings              ?status=&date=&company=
POST   /api/meetings
GET    /api/meetings/:id
PUT    /api/meetings/:id
PATCH  /api/meetings/:id/status   { "status": "Completed" }
DELETE /api/meetings/:id
```

### Services
```
GET    /api/services              ?category=&status=
POST   /api/services
GET    /api/services/:id
PUT    /api/services/:id
DELETE /api/services/:id
```

### Proposals
```
GET    /api/proposals             ?status=&client=
POST   /api/proposals
GET    /api/proposals/:id
PUT    /api/proposals/:id
PATCH  /api/proposals/:id/status
DELETE /api/proposals/:id
```

### Dashboard (Aggregations)
```
GET    /api/dashboard/stats          → total leads, companies, deals, proposals
GET    /api/dashboard/lead-growth    → monthly lead count array
GET    /api/dashboard/revenue        → monthly revenue array
GET    /api/dashboard/deals-by-stage → count per stage
GET    /api/dashboard/lead-sources   → count per source
GET    /api/dashboard/performance    → per-user deals & revenue
```

---

## ⚙️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI library |
| Vite | 6 | Build tool + dev server |
| TanStack Router | 1.x | File-based client routing |
| TanStack Query | 5.x | Server state + caching (ready to use) |
| Tailwind CSS | 4 | Utility-first styling |
| Recharts | 2.x | Dashboard charts |
| Lucide React | 0.575 | Icon library |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| Radix UI | Various | Accessible headless components |

### Backend (To Build)
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database + ODM |
| JWT + bcryptjs | Auth + password hashing |
| cors | Cross-origin requests |
| dotenv | Environment variables |
| multer | File upload (CSV import) |
| csv-parser | Parse uploaded CSV files |
| express-validator | Input validation |

---

## 🚀 Getting Started

### Frontend Dev Server
```bash
cd frontend
npm install
cp .env.example .env        # Fill in VITE_API_BASE_URL
npm run dev                 # → http://localhost:5173
```

### Backend Setup (to build)
```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken multer csv-parser express-validator
npm install -D nodemon

# Add to package.json scripts:
# "dev": "nodemon src/index.js"

npm run dev                 # → http://localhost:5000
```

---

## 🔄 Frontend → Backend Wiring Guide

### Pattern for every page (example: Leads)

```jsx
// 1. Replace dummy import with TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// 2. Fetch leads
const { data: leadsList = [], isLoading } = useQuery({
  queryKey: ["leads"],
  queryFn: () =>
    fetch(`${BASE}/api/leads`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(r => r.json()),
});

// 3. Create lead
const queryClient = useQueryClient();
const createLead = useMutation({
  mutationFn: (data) => fetch(`${BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: JSON.stringify(data),
  }),
  onSuccess: () => queryClient.invalidateQueries(["leads"]),
});

// 4. Inline status change → instantly saves to DB
const updateStatus = useMutation({
  mutationFn: ({ id, status }) =>
    fetch(`${BASE}/api/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ status }),
    }),
  onSuccess: () => queryClient.invalidateQueries(["leads"]),
});

// In JSX status dropdown:
onChange={(e) => updateStatus.mutate({ id: l._id, status: e.target.value })}
```

**Same pattern for:** Contacts, Companies, Deals, Meetings, Services, Proposals.

---

## 🔐 Authentication Flow

```
1. User → POST /api/auth/login { email, password }
2. Backend verifies → returns { token, user }
3. Frontend stores token in localStorage
4. All API requests → Authorization: Bearer <token> header
5. Backend JWT middleware verifies on every protected route
6. On 401 response → redirect to /login
```

---

## 📋 Development Checklist

### Phase 1 — Backend Setup ⬜
- [ ] Initialize `backend/` Node.js + Express project
- [ ] Connect MongoDB Atlas (set `MONGO_URI` in `.env`)
- [ ] Create all 8 Mongoose models (schemas above)
- [ ] Seed database with data from `frontend/src/data/dummy.js`
- [ ] Build all REST API routes with CRUD
- [ ] Add PATCH `/status` endpoints for leads, meetings, deals
- [ ] Add JWT auth middleware
- [ ] Add CSV export endpoints (streaming)
- [ ] Add CSV import endpoints (multer + csv-parser)
- [ ] Add dashboard aggregation endpoints
- [ ] Test all endpoints with Postman / Thunder Client

### Phase 2 — Frontend Wiring ⬜
- [ ] Set `VITE_API_BASE_URL=http://localhost:5000` in `frontend/.env`
- [ ] Install TanStack Query (already in package.json)
- [ ] Add QueryClientProvider in `main.jsx`
- [ ] Wire **Leads page** → all CRUD + inline status PATCH
- [ ] Wire **Contacts page** → all CRUD
- [ ] Wire **Meetings page** → all CRUD + inline status PATCH
- [ ] Wire **Companies page** → all CRUD + CSV export/import
- [ ] Wire **Deals page** → all CRUD + stage PATCH
- [ ] Wire **Services page** → all CRUD
- [ ] Wire **Proposals page** → all CRUD
- [ ] Wire **Dashboard** → aggregation API calls

### Phase 3 — Auth ⬜
- [ ] Create `/login` route and page
- [ ] Add auth context + protected route wrapper
- [ ] Store JWT in localStorage or httpOnly cookie
- [ ] Add user profile in header

### Phase 4 — Production ⬜
- [ ] Deploy backend to Render / Railway / VPS
- [ ] Deploy frontend to Vercel / Netlify
- [ ] Set production env variables
- [ ] Set up MongoDB Atlas (production cluster)
- [ ] Configure CORS for production domain

---

## 🌍 Environment Variables

See `frontend/.env.example` and `backend/.env.example` for all required variables.

---

*Built for **Exim Nexus** — India's Export-Import Trade Advisory CRM. All values in Indian Rupees (₹).*