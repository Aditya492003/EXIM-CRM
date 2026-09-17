# 🌐 EXIM Nexus CRM — Full System Documentation

> **Next-Generation Export-Import Trade Advisory CRM Platform**  
> Built for Global Trade Consultants, DGFT Advisors, Customs Brokers, and Logistics Specialists.  
> Powered by **React 19**, **Vite**, **TanStack Router & Query**, **Node.js Express 5**, **MongoDB Atlas**, **Clerk Auth**, **Firebase Cloud Messaging**, **Cloudinary**, and **Nodemailer**.

---

## 📑 Table of Contents

1. [System Overview & Architecture](#-system-overview--architecture)
2. [Key Features & Functional Modules](#-key-features--functional-modules)
   - [Authentication & Role-Based Workspaces](#1-authentication--role-based-workspaces)
   - [Executive Dashboard & Real-Time Analytics](#2-executive-dashboard--real-time-analytics)
   - [Leads Management & 1-Click Deal Conversion](#3-leads-management--1-click-deal-conversion)
   - [Deals & Sales Pipeline Management](#4-deals--sales-pipeline-management)
   - [Company & Client Account Directory](#5-company--client-account-directory)
   - [Contacts Directory](#6-contacts-directory)
   - [Meetings & Calendar Management](#7-meetings--calendar-management)
   - [Employee Management & Onboarding Hub](#8-employee-management--onboarding-hub)
   - [Dedicated Employee Portal](#9-dedicated-employee-portal)
   - [Proposal Builder & Dynamic DOCX Engine](#10-proposal-builder--dynamic-docx-engine)
   - [Cross-Workspace Collaboration & Requests](#11-cross-workspace-collaboration--requests)
   - [EXIM Services Catalog](#12-exim-services-catalog)
   - [Push Notifications & Alert Center](#13-push-notifications--alert-center)
   - [Public Interactive Landing Page](#14-public-interactive-landing-page)
3. [Project Directory Structure](#-project-directory-structure)
4. [Tech Stack & Dependencies](#-tech-stack--dependencies)
5. [Database Schemas & Mongoose Models](#-database-schemas--mongoose-models)
6. [Complete REST API Reference](#-complete-rest-api-reference)
7. [Environment Variables](#-environment-variables)
8. [Installation & Local Setup](#-installation--local-setup)
9. [Deployment Guide](#-deployment-guide)

---

## 🏢 System Overview & Architecture

**EXIM Nexus CRM** is a purpose-built B2B Customer Relationship Management and Sales Execution system engineered specifically for the foreign trade advisory sector. It manages the entire client lifecycle—from initial DGFT enquiry and company vetting to commercial proposal delivery, meeting follow-ups, deal closing, and team collaboration.

### 🏛️ Multi-Tenant & Multi-Role Architecture

The platform operates on a workspace isolation model governed by **Clerk Authentication**:

```
                              ┌─────────────────────────────┐
                              │     Clerk Authentication    │
                              └──────────────┬──────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
          ┌───────────────────────┐                     ┌───────────────────────┐
          │  Workspace Manager    │                     │   Trade Consultant    │
          │     (Admin Role)      │                     │    (Employee Role)    │
          └───────────┬───────────┘                     └───────────┬───────────┘
                      │                                             │
      Full Workspace Governance                     Assigned & Collaborative Views
      • Team Management & Invites                   • My Leads, Deals & Accounts
      • Company Ownership & Approvals               • Onboarding Modules & Tasks
      • Proposal Templates & Pricing                • Personal Gmail SMTP Config
      • Cross-Workspace Collaborations              • Assigned Meeting Calendar
```

- **Workspace Manager (Admin)**: Owns organizational data (`workspaceManagerId`), manages team members, approves/rejects cross-workspace company access and collaboration requests, and monitors high-level pipeline analytics.
- **Trade Consultant / Employee**: Works within a dedicated employee portal (`/employee/*`), manages assigned accounts, tracks onboarding progress, configures personal SMTP credentials for custom proposal delivery, and requests access to shared leads.

---

## 🚀 Key Features & Functional Modules

### 1. Authentication & Role-Based Workspaces
- **Clerk Authentication**: Secure OAuth (Google, GitHub, etc.) and email/password sign-in.
- **Dynamic Session Resolution**: Automatic backend mapping of Clerk user IDs to Employee records with automated workspace scoping.
- **Team Account Invitation**: Managers can invite employees directly from the UI with automated HTML email dispatch containing an onboarding link.
- **Role Isolation**: Automatic routing between the Manager Master Portal and the Dedicated Employee Portal.

### 2. Executive Dashboard & Real-Time Analytics
- **Live KPI Metric Cards**: Total Leads, Active Companies, Open Deals, Monthly Closed Revenue, and Conversion Rates.
- **Visual Analytics Charts (Recharts)**:
  - **Lead Growth Area Chart**: Monthly trend of new leads acquired.
  - **Revenue Performance Bar Chart**: Monthly billed revenue in Indian Rupees (₹).
  - **Deals by Stage Distribution**: Pipeline funnel breakdown (`New`, `Qualified`, `Proposal Sent`, `Negotiation`, `Won`, `Lost`).
  - **Lead Acquisition Sources Doughnut**: Traffic distribution (Website, Referral, LinkedIn, Cold Call, Exhibition, etc.).
  - **Team Leaderboard**: Performance metrics per team member (Won deals & revenue contribution).
- **Recent Activity Feed & Top Accounts**: Quick overview of recent leads and high-value client engagements.
- **Global Search**: Search across leads, deals, companies, and contacts from the top navigation bar.

### 3. Leads Management & 1-Click Deal Conversion
- **Complete Lead Lifecycle**: Status tracking across `New`, `Contacted`, `Interested`, `Proposal Sent`, `Negotiation`, `Converted`, `Lost`, and `Inactive`.
- **Custom EXIM Fields**: Enquiry status, loss reasons, trade service requirements, region, website, and company size.
- **Interactive Data Table**: Search, column toggling, quick filter pills, source/status multi-filters, and pagination.
- **Inline Status Editor**: Instant status update dropdown directly from table rows with backend synchronization.
- **Lead Slide-Over Drawer**: Detailed view showing client contact info, engagement history, and an interactive **Activity Timeline**.
- **Favorite Marking**: Star important leads for quick access.
- **1-Click Convert Lead to Deal**: Convert qualified leads into active deals with automatic company creation and contact association.
- **Bulk CSV Import & Export**: Export lead databases to CSV and import bulk lead files.

### 4. Deals & Sales Pipeline Management
- **Pipeline Stages**: Structured sales stages from `New` → `Qualified` → `Proposal Sent` → `Negotiation` → `Won` / `Lost`.
- **Value Tracking**: Deal values recorded in Indian Rupees (₹) with expected close dates and actual win/loss timestamps.
- **Priority Matrix**: Flag deals as `Low`, `Medium`, or `High` priority.
- **Inline Stage Selector**: Move deals through pipeline stages with immediate backend updates.
- **Deal Timeline & Collaborators**: Multi-member assignment allowing secondary consultants to collaborate on complex trade deals.

### 5. Company & Client Account Directory
- **B2B Account Repository**: Company profile management including GSTIN, PAN, registered address, website, and primary contact links.
- **Cloudinary Logo Upload**: Upload and store high-resolution client company logos.
- **Account Health Metrics**: Automated counters for Active Deals, Won Deals, Open Deals, Lost Deals, and Cumulative Revenue.
- **Status Categories**: Filter accounts by `Active`, `Prospect`, or `Inactive`.
- **Bulk Import & Export**: Import company rosters via CSV with auto-mapping, and export company lists.
- **Company Access Governance**: Handles company ownership across different workspace managers.

### 6. Contacts Directory
- **Executive Directory**: Manage key client decision-makers (Export Heads, Logistics Managers, CFOs).
- **Company Association**: Directly link contacts to parent companies with designated roles and avatar uploads.
- **Direct Action Links**: One-click phone calling and email composition triggers.

### 7. Meetings & Calendar Management
- **Meeting Types**: `Discovery Call`, `Follow-up`, `Proposal Presentation`, `QBR`, `Demo`, `Negotiation`, `Closure`.
- **Meeting Modes**: Virtual (Google Meet, Zoom, MS Teams) and In-Person with location notes.
- **Inline Status Management**: Mark meetings as `Scheduled`, `Completed`, `Cancelled`, or `Rescheduled`.
- **Outcome & Meeting Notes**: Record detailed minutes of meetings (MoM), outcome status (`Done`, `Postponed`, `Cancelled`), and next steps.
- **Employee-Specific Filter**: Employees only see meetings where they are designated as organizer or attendee.

### 8. Employee Management & Onboarding Hub
- **Team Roster**: Directory of all employees with contact details, department, role, joined date, and working status.
- **Automated Invitations**: Managers send custom email invitations with onboarding links.
- **Onboarding Progress Tracker**: Structured 7-step onboarding checklist:
  1. Office Tour
  2. Management Introductory
  3. Work Tools Setup
  4. Meet Your Colleagues
  5. Duties Journal
  6. Requests Handling
  7. Activity Tracking
- **Live Working Status Toggle**: Team members can set their status to `Available`, `Working on Leads`, or `On Leave`.

### 9. Dedicated Employee Portal
- **Focused Employee Routes**:
  - `/employee/dashboard`: Personal KPI summary, assigned tasks, and quick actions.
  - `/employee/leads`: Leads assigned to or collaborated on by the employee.
  - `/employee/deals`: Personal deals pipeline.
  - `/employee/companies`: Client accounts managed by the consultant.
  - `/employee/meetings`: Personal schedule of upcoming and past meetings.
  - `/employee/proposals`: Proposals authored by or assigned to the employee.
  - `/employee/about`: Personal profile, onboarding status roadmap, and custom SMTP settings.
- **Personalized SMTP Configuration**: Employees can configure their own Gmail App Password to send proposals directly from their official company email address.

### 10. Proposal Builder & Dynamic DOCX Engine
- **Multi-Section Proposal Generator (`/proposals/new`)**:
  - Client & service selection with auto-filled pricing.
  - Custom dynamic sections (Executive Summary, Scope of Work, Deliverables, Commercial Terms, Compliance Timeline).
  - Real-time client-side preview.
- **Reusable Proposal Templates (`/proposals/templates`)**:
  - Upload custom `.docx` templates containing variable placeholders (e.g., `{clientName}`, `{serviceName}`, `{proposalValue}`, `{validTill}`).
  - Instant placeholder extraction and template categorization.
- **DOCX Generation & Preview**:
  - Client-side document generation using `docxtemplater`, `pizzip`, and `docx`.
  - In-browser document preview rendered with `docx-preview`.
  - Instant Word document download (`.docx`).
- **Direct Proposal Email Dispatch**:
  - Send finalized proposals directly to client email addresses with attached files.
  - Email transport powered by Nodemailer using either workspace default credentials or the employee's personal SMTP credentials.
- **Proposal Lifecycle**: Track status through `Draft` → `Sent` → `Under Review` → `Approved` / `Rejected` / `Expired`.

### 11. Cross-Workspace Collaboration & Requests
- **Lead & Deal Collaboration Requests (`/collaboration-requests`)**:
  - Employees or Managers can request to join an existing lead or deal owned by another workspace.
  - Owner manager receives in-app notifications to **Approve** or **Reject** with custom remarks.
  - Upon approval, the requesting user is added to `collaborators` and granted read/write access.
- **Company Access Requests (`/company-requests`)**:
  - Prevents duplicate company profiles across teams.
  - Request access to companies registered by other managers with automated approval workflows.

### 12. EXIM Services Catalog
- **Advisory Services Directory**: Pre-configured trade advisory catalog covering:
  - DGFT Advisory & Licensing (IEC, EPCG, Advance Authorisation, RoDTEP, RoSCTL)
  - Customs Clearance & Classification
  - Capital Goods Project Imports
  - Special Economic Zones (SEZ) & EOU Compliance
  - AEO (Authorized Economic Operator) Certification
  - Foreign Trade Policy (FTP) Audit & Legal Dispute Resolution
- **Pricing & Deliverables**: Base price, service duration, and feature lists.

### 13. Push Notifications & Alert Center
- **In-App Notification Center**: Popover tray with unread counters, notification categories, and quick read/unread toggles.
- **Firebase Cloud Messaging (FCM)**: Web push notifications delivered to desktop/mobile devices for:
  - New lead assignments
  - Meeting reminders & reschedules
  - Collaboration & company request approvals/rejections
  - Proposal status changes
- **Device Token Management**: Automatic FCM token registration and cleanup upon user logout.

### 14. Public Interactive Landing Page
- **Hero Showcase**: High-impact modern hero section with interactive preview badges.
- **Book a Demo Modal**: Interactive lead capture form for prospective clients.
- **Feature Highlights & Testimonials**: Comprehensive overview of EXIM CRM capabilities.
- **Clerk Auth Triggers**: Direct integration with Clerk sign-in and sign-up modals.

---

## 🗂️ Project Directory Structure

```
EXIM-CRM/
├── backend/
│   ├── api/                           ← Vercel serverless function entry points
│   │   └── index.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js          ← Cloudinary storage & SDK configuration
│   │   │   ├── db.js                  ← MongoDB Atlas connection pool
│   │   │   ├── email.js               ← Nodemailer transports (proposals & invites)
│   │   │   └── firebase.js            ← Firebase Admin SDK for FCM push notifications
│   │   ├── controllers/
│   │   │   ├── collaborationRequestsController.js
│   │   │   ├── companiesController.js
│   │   │   ├── companyRequestsController.js
│   │   │   ├── contactsController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── dealsController.js
│   │   │   ├── employeesController.js
│   │   │   ├── leadsController.js
│   │   │   ├── meetingsController.js
│   │   │   ├── notificationsController.js
│   │   │   ├── proposalsController.js
│   │   │   ├── servicesController.js
│   │   │   └── templatesController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js      ← Clerk JWT verification & workspace scoping
│   │   │   ├── errorMiddleware.js     ← Global error handler
│   │   │   ├── uploadMiddleware.js    ← Multer file upload handler
│   │   │   └── validateMiddleware.js  ← Express-validator utility
│   │   ├── models/                    ← Mongoose Schemas (13 Collections)
│   │   │   ├── CollaborationRequest.js
│   │   │   ├── Company.js
│   │   │   ├── CompanyRequest.js
│   │   │   ├── Contact.js
│   │   │   ├── Deal.js
│   │   │   ├── DeviceToken.js
│   │   │   ├── Employee.js
│   │   │   ├── Lead.js
│   │   │   ├── Meeting.js
│   │   │   ├── Notification.js
│   │   │   ├── Proposal.js
│   │   │   ├── ProposalTemplate.js
│   │   │   └── Services.js
│   │   ├── routes/                    ← Express API Route Handlers
│   │   │   ├── collaborationRequestsRoutes.js
│   │   │   ├── companiesRoutes.js
│   │   │   ├── companyRequestsRoutes.js
│   │   │   ├── contactsRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── dealsRoutes.js
│   │   │   ├── employeesRoutes.js
│   │   │   ├── leadsRoutes.js
│   │   │   ├── meetingsRoutes.js
│   │   │   ├── notificationsRoutes.js
│   │   │   ├── proposalsRoutes.js
│   │   │   ├── servicesRoutes.js
│   │   │   └── templatesRoutes.js
│   │   ├── services/
│   │   │   └── pushNotificationService.js ← FCM push notification dispatcher
│   │   └── index.js                   ← Express app setup & route mounting
│   ├── .env                           ← Backend environment variables
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/                    ← Images & branding assets
│   │   ├── components/
│   │   │   ├── crm/
│   │   │   │   ├── AddMeetingModal.jsx
│   │   │   │   ├── CompanySearchCombobox.jsx
│   │   │   │   ├── ConvertLeadToDealModal.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   └── UserAvatar.jsx
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx      ← Manager workspace layout
│   │   │   │   ├── EmployeeLayout.jsx ← Employee portal layout
│   │   │   │   ├── EmployeeSidebar.jsx
│   │   │   │   ├── EmployeeTopBar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── TopBar.jsx         ← Global search, notifications & user profile
│   │   │   └── ui/                    ← Radix UI design system components
│   │   │       ├── avatar.jsx, badge.jsx, button.jsx, card.jsx, chart.jsx,
│   │   │       ├── dialog.jsx, dropdown-menu.jsx, input.jsx, select.jsx,
│   │   │       ├── sheet.jsx, table.jsx, tabs.jsx, sonner.jsx, tooltip.jsx ...
│   │   ├── context/
│   │   │   └── ThemeContext.jsx       ← Dark/Light mode theme provider
│   │   ├── routes/                    ← TanStack Router Page Routes
│   │   │   ├── __root.jsx             ← Root route wrapper & QueryClientProvider
│   │   │   ├── landing.jsx            ← Public landing page & demo booking
│   │   │   ├── index.jsx              ← Manager Executive Dashboard
│   │   │   ├── leads.jsx              ← Leads management table & drawers
│   │   │   ├── deals.jsx              ← Deals pipeline & Kanban
│   │   │   ├── companies.jsx          ← Companies directory & CSV tools
│   │   │   ├── contacts.jsx           ← Contacts directory
│   │   │   ├── meetings.jsx           ← Meetings calendar & scheduler
│   │   │   ├── employees.jsx          ← Employee management & invitations
│   │   │   ├── company-requests.jsx   ← Company access approval hub
│   │   │   ├── collaboration-requests.jsx ← Lead/deal collaboration requests
│   │   │   ├── services.jsx           ← EXIM advisory catalog
│   │   │   ├── proposals.index.jsx    ← Proposals list & status tracker
│   │   │   ├── proposals.new.jsx      ← Multi-section proposal builder & emailer
│   │   │   ├── proposals.templates.jsx← DOCX proposal template library
│   │   │   ├── employee.dashboard.jsx ← Employee personal dashboard
│   │   │   ├── employee.leads.jsx     ← Employee assigned leads
│   │   │   ├── employee.deals.jsx     ← Employee assigned deals
│   │   │   ├── employee.companies.jsx ← Employee assigned companies
│   │   │   ├── employee.meetings.jsx  ← Employee assigned meetings
│   │   │   ├── employee.proposals.jsx ← Employee assigned proposals
│   │   │   └── employee.about.jsx     ← Employee onboarding & SMTP settings
│   │   ├── routeTree.gen.js           ← Generated TanStack Route Tree
│   │   ├── router.jsx                 ← Router instance configuration
│   │   ├── main.jsx                   ← App entry point & Clerk Provider
│   │   └── styles.css                 ← CSS design tokens & Tailwind imports
│   ├── .env                           ← Frontend environment variables
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── .gitignore
├── vercel.json                        ← Monorepo routing configuration for Vercel
└── README.md
```

---

## 💻 Tech Stack & Dependencies

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.0.0 | Core UI rendering engine |
| **Vite** | 6.0.0 | Next-generation build tool and development server |
| **TanStack Router** | 1.170.x | Type-safe, file-based client-side routing |
| **TanStack Query** | 5.101.x | Server state management, auto-caching, and mutations |
| **Tailwind CSS** | 4.0.0 | Utility-first responsive design framework |
| **Radix UI** | Latest | Accessible, unstyled headless UI components |
| **@clerk/clerk-react** | 5.61.x | Authentication, user management, and JWT session handling |
| **Recharts** | 2.15.x | Responsive analytics charts (Area, Bar, Pie, Radar) |
| **docxtemplater & pizzip** | Latest | Dynamic `.docx` template variable interpolation |
| **docx-preview** | Latest | In-browser client-side Word document rendering |
| **docx & file-saver** | Latest | Programmatic document creation and local file saving |
| **Firebase JS SDK** | 12.18.x | Client-side push notifications & FCM registration |
| **Lucide React** | 0.575.x | Comprehensive UI icon system |
| **Sonner** | 2.0.x | Smooth, toast notification alerts |
| **Axios** | 1.18.x | HTTP client for API communication |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js (ESM)** | Node 18+ | JavaScript runtime environment |
| **Express** | 5.2.x | RESTful API server framework |
| **MongoDB & Mongoose** | 9.8.x | Document database & Object Data Modeling (ODM) |
| **@clerk/clerk-sdk-node** | 4.13.x | Backend token verification and Clerk user administration |
| **Firebase Admin SDK** | 14.3.x | Server-side FCM push notification dispatch |
| **Cloudinary** | 1.41.x | Cloud image and document storage for attachments/logos |
| **Multer & Storage** | Latest | Multipart form handling and upload streaming |
| **Nodemailer** | 9.0.x | SMTP email transport for proposal and invitation delivery |
| **csv-parser** | 3.2.x | High-performance CSV file streaming and data parsing |
| **Cors & Dotenv** | Latest | Cross-origin resource sharing & environment loading |

---

## 🛢️ Database Schemas & Mongoose Models

The backend utilizes **13 Mongoose models** to support multi-tenant workspaces:

### 1. `Lead` Schema (`leads`)
```javascript
{
  name: { type: String, required: true },
  company: String,
  companyPhone: String,
  companyEmail: String,
  companyId: { type: ObjectId, ref: 'Company' },
  phone: String,
  email: String,
  service: String,
  serviceId: { type: ObjectId, ref: 'Service' },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Exhibition', 'Trade Show', 'Email Campaign', 'Partner', 'Google Ads', 'Other']
  },
  assignedTo: String,
  assignedToClerkId: String,
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Interested', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost', 'Inactive'],
    default: 'New'
  },
  notes: String,
  enquiryStatus: String,
  deadReason: String,
  websiteUrl: String,
  companySize: String,
  region: String,
  meetingType: String,
  meetingDate: Date,
  meetingMode: String,
  meetingOutcome: String,
  isFavorite: { type: Boolean, default: false },
  createdByClerkId: String,
  workspaceManagerId: { type: String, index: true },
  collaborators: [{
    clerkId: String,
    name: String,
    email: String,
    role: String,
    managerId: String,
    managerName: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  collaboratingWorkspaceIds: [{ type: String, index: true }],
  timeline: [{
    activity: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdDate: { type: Date, default: Date.now }
}
```

### 2. `Deal` Schema (`deals`)
```javascript
{
  name: { type: String, required: true },     // Deal Title
  company: String,
  companyId: { type: ObjectId, ref: 'Company' },
  leadId: { type: ObjectId, ref: 'Lead' },
  contactId: { type: ObjectId, ref: 'Contact' },
  value: Number,                              // Value in ₹
  stage: {
    type: String,
    enum: ['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignedTo: String,
  assignedToClerkId: String,
  service: String,
  serviceId: { type: ObjectId, ref: 'Service' },
  expectedCloseDate: Date,
  closedDate: Date,
  notes: String,
  createdByClerkId: String,
  workspaceManagerId: { type: String, index: true },
  collaborators: [{ clerkId: String, name: String, email: String, role: String, joinedAt: Date }],
  collaboratingWorkspaceIds: [{ type: String, index: true }],
  timeline: [{ activity: String, performedBy: String, timestamp: Date }],
  createdDate: { type: Date, default: Date.now }
}
```

### 3. `Company` Schema (`companies`)
```javascript
{
  name: { type: String, required: true },
  industry: String,
  primaryContact: String,
  primaryContactId: { type: ObjectId, ref: 'Contact' },
  phone: String,
  email: String,
  assignedManager: String,
  assignedManagerClerkId: String,
  status: { type: String, enum: ['Active', 'Inactive', 'Prospect'], default: 'Active' },
  revenue: Number,                            // Cumulative value in ₹
  activeDeals: { type: Number, default: 0 },
  wonDeals: { type: Number, default: 0 },
  openDeals: { type: Number, default: 0 },
  lostDeals: { type: Number, default: 0 },
  website: String,
  address: String,
  gstin: String,                              // GST Identification Number
  pan: String,                                // Permanent Account Number
  logoUrl: String,                            // Cloudinary URL
  notes: String,
  createdByClerkId: String,
  workspaceManagerId: { type: String, index: true },
  sharedWithManagerIds: [{ type: String, index: true }],
  ownerManagerName: String,
  ownerManagerEmail: String,
  createdDate: { type: Date, default: Date.now }
}
```

### 4. `Employee` Schema (`employees`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: String,
  role: { type: String, default: 'Trade Consultant' },
  department: { type: String, default: 'Sales' },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  clerkUserId: { type: String, sparse: true, unique: true },
  workingStatus: { type: String, enum: ['Available', 'Working on Leads', 'On Leave'], default: 'Available' },
  lastLogin: Date,
  smtpUser: String,                           // Optional custom employee Gmail username
  smtpPass: String,                           // Optional 16-char Google App Password
  managerClerkId: { type: String, index: true },
  managerName: String,
  managerEmail: String,
  hrName: { type: String, default: 'Kate Middleton' },
  leadName: { type: String, default: 'Eugene Hummell' },
  position: String,
  onboardingRequired: { type: Boolean, default: true },
  onboardingStatus: { type: String, default: 'Onboarding' },
  onboardingProgress: { type: Number, default: 38 },
  onboardingScripts: [
    { id: String, name: String, active: Boolean, percentage: Number }
  ],
  invitedBy: String,
  joinedAt: { type: Date, default: Date.now }
}
```

### 5. `Proposal` Schema (`proposals`)
```javascript
{
  number: { type: String, unique: true },     // e.g. "PRO-2025-001"
  client: String,
  clientEmail: String,
  clientId: { type: ObjectId, ref: 'Company' },
  contactId: { type: ObjectId, ref: 'Contact' },
  service: String,
  serviceId: { type: ObjectId, ref: 'Service' },
  value: Number,                              // Value in ₹
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Under Review', 'Approved', 'Rejected', 'Expired'],
    default: 'Draft'
  },
  validTill: Date,
  sections: [{ title: String, content: String }],
  attachmentUrl: String,                      // Cloudinary / Storage attachment URL
  templateId: ObjectId,
  assignedTo: String,
  createdByClerkId: String,
  workspaceManagerId: { type: String, index: true },
  sentDate: Date,
  approvedDate: Date,
  createdDate: { type: Date, default: Date.now }
}
```

### 6. `ProposalTemplate` Schema (`proposaltemplates`)
```javascript
{
  name: { type: String, required: true },
  description: String,
  category: { type: String, default: 'Customs & DGFT' },
  fileUrl: { type: String, required: true },
  fileName: String,
  fileSize: String,
  variables: [String],                        // Detected placeholders: ["clientName", "serviceFee"]
  createdByClerkId: String,
  workspaceManagerId: { type: String, index: true },
  createdDate: { type: Date, default: Date.now }
}
```

### 7. `Meeting` Schema (`meetings`)
```javascript
{
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['Discovery Call', 'Follow-up', 'Proposal Presentation', 'QBR', 'Demo', 'Negotiation', 'Closure']
  },
  company: String,
  companyId: { type: ObjectId, ref: 'Company' },
  attendee: String,
  contactId: { type: ObjectId, ref: 'Contact' },
  leadId: { type: ObjectId, ref: 'Lead' },
  mode: String,                               // "Virtual (Google Meet)" | "In-Person"
  date: Date,
  time: String,                               // "10:00 AM"
  duration: String,                           // "1 hour"
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  link: String,                               // Virtual meeting link
  notes: String,
  organizedByClerkId: String,
  assignedToClerkId: String,
  assignedToName: String,
  outcomeStatus: { type: String, enum: ['', 'Done', 'Postponed', 'Cancelled'], default: '' },
  outcomeNotes: { type: String, default: '' },
  workspaceManagerId: { type: String, index: true },
  createdDate: { type: Date, default: Date.now }
}
```

### 8. `CollaborationRequest` Schema (`collaborationrequests`)
```javascript
{
  entityType: { type: String, enum: ['Lead', 'Deal'], required: true },
  entityId: { type: ObjectId, required: true },
  entityTitle: { type: String, required: true },
  companyName: String,
  contactName: String,
  serviceName: String,
  requesterClerkId: { type: String, required: true },
  requesterName: { type: String, required: true },
  requesterEmail: String,
  requesterRole: { type: String, enum: ['manager', 'employee'], default: 'employee' },
  requesterManagerId: String,
  requesterManagerName: String,
  ownerClerkId: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerManagerId: String,
  ownerManagerName: String,
  ownerManagerEmail: String,
  reason: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired'], default: 'Pending' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: Date
}
```

### 9. `CompanyRequest` Schema (`companyrequests`)
```javascript
{
  companyId: { type: ObjectId, ref: 'Company', required: true },
  companyName: { type: String, required: true },
  ownerManagerId: { type: String, required: true },
  ownerManagerName: String,
  ownerManagerEmail: String,
  requestorManagerId: { type: String, required: true },
  requestedByClerkId: { type: String, required: true },
  requestedByName: { type: String, required: true },
  requestedByEmail: String,
  requestedByRole: { type: String, enum: ['manager', 'employee'], default: 'manager' },
  reason: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdDate: { type: Date, default: Date.now },
  resolvedDate: Date
}
```

### 10. `Notification` & `DeviceToken` Schemas
```javascript
// Notification
{
  recipientClerkId: { type: String, required: true, index: true },
  senderName: String,
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['lead', 'deal', 'meeting', 'collaboration', 'company_request', 'proposal', 'system'], default: 'system' },
  link: String,
  isRead: { type: Boolean, default: false },
  workspaceManagerId: String,
  createdAt: { type: Date, default: Date.now }
}

// DeviceToken
{
  clerkUserId: { type: String, required: true, unique: true },
  fcmToken: { type: String, required: true },
  userAgent: String,
  updatedAt: { type: Date, default: Date.now }
}
```

---

## 🔌 Complete REST API Reference

All protected endpoints require the HTTP header:  
`Authorization: Bearer <clerk_session_token>`

### 📊 Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Fetches aggregated KPI cards (Leads, Companies, Deals, Revenue). |
| `GET` | `/api/dashboard/lead-growth` | Monthly lead acquisition trend data for Area Chart. |
| `GET` | `/api/dashboard/revenue` | Monthly billed and closed revenue array for Bar Chart. |
| `GET` | `/api/dashboard/deals-by-stage` | Stage distribution counts for deal pipeline funnel. |
| `GET` | `/api/dashboard/lead-sources` | Lead count distribution by acquisition source. |
| `GET` | `/api/dashboard/performance` | Leaderboard of top-performing team members and managers. |
| `GET` | `/api/dashboard/search?q={query}` | Global search across leads, deals, companies, and contacts. |

### 🎯 Leads Management (`/api/leads`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads` | List leads with pagination, search, status, source, and service filters. |
| `POST` | `/api/leads` | Create a new lead record with automated activity timeline logging. |
| `GET` | `/api/leads/:id` | Retrieve single lead by ID with complete activity history. |
| `PUT` | `/api/leads/:id` | Update complete lead profile. |
| `DELETE` | `/api/leads/:id` | Delete a lead record. |
| `PATCH` | `/api/leads/:id/status` | Inline update of lead status (`{ "status": "Interested" }`). |
| `PATCH` | `/api/leads/:id/notes` | Inline update of lead notes. |
| `PATCH` | `/api/leads/:id/favorite` | Toggle favorite star status. |
| `POST` | `/api/leads/:id/convert` | **1-Click Conversion**: Convert lead into an active Deal & linked Company. |
| `GET` | `/api/leads/export/csv` | Stream all workspace leads to a downloadable CSV file. |

### 💼 Deals & Pipeline (`/api/deals`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/deals` | Retrieve all pipeline deals with stage and priority query filters. |
| `POST` | `/api/deals` | Create a new deal with company/contact references and value in ₹. |
| `GET` | `/api/deals/:id` | Get deal details, value, expected closing date, and timeline. |
| `PUT` | `/api/deals/:id` | Update deal information. |
| `DELETE` | `/api/deals/:id` | Delete a deal from the pipeline. |
| `PATCH` | `/api/deals/:id/stage` | Inline update deal stage (`{ "stage": "Won" }`). |
| `PATCH` | `/api/deals/:id/notes` | Inline update deal notes. |

### 🏢 Companies & Accounts (`/api/companies`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/companies` | List workspace companies with status, industry, and search filters. |
| `POST` | `/api/companies` | Create new company (supports multipart `logo` image upload to Cloudinary). |
| `GET` | `/api/companies/:id` | Retrieve company profile, GSTIN, PAN, and active deal counts. |
| `PUT` | `/api/companies/:id` | Update company information (supports multipart `logo` update). |
| `DELETE` | `/api/companies/:id` | Delete company record. |
| `POST` | `/api/companies/bulk` | Bulk import companies from parsed CSV payload. |
| `GET` | `/api/companies/export/csv`| Stream company directory to a downloadable CSV file. |

### 👤 Contacts Directory (`/api/contacts`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/contacts` | List contacts with search and company query filters. |
| `POST` | `/api/contacts` | Create contact profile (supports multipart `avatar` upload). |
| `GET` | `/api/contacts/:id` | Get contact information with associated company details. |
| `PUT` | `/api/contacts/:id` | Update contact profile. |
| `DELETE` | `/api/contacts/:id` | Delete contact. |

### 📅 Meetings & Calendar (`/api/meetings`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/meetings` | List all meetings across the workspace. |
| `GET` | `/api/meetings/employee` | Retrieve only meetings assigned to the authenticated employee. |
| `POST` | `/api/meetings` | Schedule a new client meeting (Virtual or In-Person). |
| `GET` | `/api/meetings/:id` | Retrieve meeting details and notes. |
| `PUT` | `/api/meetings/:id` | Update meeting details, date, time, or link. |
| `DELETE` | `/api/meetings/:id` | Delete a meeting. |
| `PATCH` | `/api/meetings/:id/status` | Inline update meeting status (`{ "status": "Completed" }`). |
| `PATCH` | `/api/meetings/:id/outcome` | Update outcome status and minutes (`{ outcomeStatus, outcomeNotes }`). |

### 👥 Team & Employee Management (`/api/employees`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List all team members in the manager's workspace. |
| `GET` | `/api/employees/me` | Fetch authenticated employee's profile, onboarding status, and SMTP settings. |
| `PUT` | `/api/employees/me` | Update employee's own profile and custom SMTP credentials. |
| `POST` | `/api/employees/invite` | Invite employee by email with automated invitation dispatch. |
| `POST` | `/api/employees/sync` | Synchronize Clerk user metadata with MongoDB employee schema. |
| `PATCH` | `/api/employees/status` | Toggle employee working status (`Available`, `Working on Leads`, `On Leave`). |
| `GET` | `/api/employees/:id` | Get employee details by ID. |
| `PUT` | `/api/employees/:id` | Update employee role, department, or manager assignment. |
| `DELETE` | `/api/employees/:id` | Delete or remove employee from workspace. |

### 📄 Proposals & DOCX Templates (`/api/proposals` & `/api/templates`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/proposals` | List all proposals with status and client filters. |
| `POST` | `/api/proposals` | Create proposal record (supports multipart `attachment` upload to Cloudinary). |
| `GET` | `/api/proposals/:id` | Retrieve proposal details, sections, and attachment URL. |
| `PUT` | `/api/proposals/:id` | Update proposal contents. |
| `DELETE` | `/api/proposals/:id` | Delete proposal. |
| `PATCH` | `/api/proposals/:id/status`| Update proposal status (`{ "status": "Approved" }`). |
| `POST` | `/api/proposals/send-email`| **Deliver Proposal**: Direct email dispatch with attached document via Nodemailer. |
| `GET` | `/api/templates` | Retrieve reusable `.docx` proposal templates with detected variables. |
| `POST` | `/api/templates` | Upload a new `.docx` template file (multipart `file` upload). |
| `DELETE` | `/api/templates/:id` | Delete proposal template. |

### 🤝 Cross-Workspace Requests (`/api/collaboration-requests` & `/api/company-requests`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/collaboration-requests` | Submit request to collaborate on a cross-workspace Lead or Deal. |
| `GET` | `/api/collaboration-requests` | List incoming and outgoing collaboration requests. |
| `PATCH`| `/api/collaboration-requests/:id/approve` | Approve request and add user to collaborator roster. |
| `PATCH`| `/api/collaboration-requests/:id/reject` | Reject collaboration request with remarks. |
| `DELETE`| `/api/collaboration-requests/remove-collaborator` | Remove a collaborator from an entity. |
| `POST` | `/api/company-requests` | Submit request to access another manager's company account. |
| `GET` | `/api/company-requests` | List incoming and outgoing company access requests. |
| `PATCH`| `/api/company-requests/:id/approve` | Grant shared access to the requested company account. |
| `PATCH`| `/api/company-requests/:id/reject` | Decline company access request. |

### 🔔 Push Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/notifications/fcm-token` | Register or update client device FCM push notification token. |
| `DELETE`| `/api/notifications/fcm-token` | Unregister FCM token upon user sign-out. |
| `GET` | `/api/notifications/my` | Retrieve in-app notifications for the authenticated user. |
| `PATCH`| `/api/notifications/:id/read` | Mark specific notification as read. |
| `DELETE`| `/api/notifications/:id` | Delete notification item. |
| `POST` | `/api/notifications` | Send manual notification (admin utility). |

### 📦 Services Catalog (`/api/services`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services` | List all EXIM trade advisory services. |
| `POST` | `/api/services` | Create new service catalog item. |
| `GET` | `/api/services/:id` | Get service details and pricing. |
| `PUT` | `/api/services/:id` | Update service description or price. |
| `DELETE` | `/api/services/:id` | Delete service item. |

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/exim_crm?retryWrites=true&w=majority

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Push Notifications (Firebase Admin SDK)
# Option A: Direct credentials in .env
FIREBASE_PROJECT_ID=exim-crm
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@exim-crm.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Option B: Path to local JSON service account key
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Transactional Email (Gmail SMTP / Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-organization-email@gmail.com
SMTP_PASS=your-16-character-google-app-password
```

### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000

# Clerk Authentication Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Firebase Web App Configuration (FCM Push Notifications)
VITE_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=exim-crm.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=exim-crm
VITE_FIREBASE_STORAGE_BUCKET=exim-crm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
VITE_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxx
VITE_FIREBASE_VAPID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **MongoDB Atlas** cluster account
- **Clerk** application account
- **Cloudinary** media account
- **Firebase** project (for FCM push notifications)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/exim-crm.git
cd EXIM-CRM
```

### Step 2: Backend Setup
```bash
cd backend
npm install

# Create and populate backend environment variables
cp .env.example .env
# Open .env and add your MONGO_URI, CLERK_SECRET_KEY, CLOUDINARY, and SMTP credentials

# Run the backend in development mode (with nodemon)
npm run dev
# Backend server runs on http://localhost:5000
```

### Step 3: Frontend Setup
```bash
# Open a new terminal
cd frontend
npm install

# Create and populate frontend environment variables
cp .env.example .env
# Open .env and add your VITE_CLERK_PUBLISHABLE_KEY and VITE_API_BASE_URL

# Start the Vite development server
npm run dev
# Frontend application runs on http://localhost:5173
```

---

## 🚀 Deployment Guide

### Deploying to Vercel (Monorepo Configuration)

The project includes root, frontend, and backend `vercel.json` configurations ready for zero-configuration monorepo deployment:

1. Push your code to a GitHub repository.
2. Link the repository to your **Vercel** dashboard.
3. Add all backend and frontend environment variables in **Project Settings → Environment Variables**.
4. The backend serverless handler is located at `backend/api/index.js` and serves all `/api/*` routes.
5. The frontend builds statically and handles single-page application routing via TanStack Router.

---

## 📜 License & Acknowledgements

- Designed and built for **EXIM Advisory & Foreign Trade Consultants**.
- All currency values formatted in Indian Rupees (**₹**).
- Made with ❤️ for the global trade and logistics community.
