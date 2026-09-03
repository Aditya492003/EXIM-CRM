import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";

import connectDb from "./config/db.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

// Route imports
import servicesRoutes from "./routes/servicesRoutes.js";
import companiesRoutes from "./routes/companiesRoutes.js";
import contactsRoutes from "./routes/contactsRoutes.js";
import leadsRoutes from "./routes/leadsRoutes.js";
import dealsRoutes from "./routes/dealsRoutes.js";
import meetingsRoutes from "./routes/meetingsRoutes.js";
import proposalsRoutes from "./routes/proposalsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import employeesRoutes from "./routes/employeesRoutes.js";
import templatesRoutes from "./routes/templatesRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import companyRequestsRoutes from "./routes/companyRequestsRoutes.js";
import collaborationRequestsRoutes from "./routes/collaborationRequestsRoutes.js";

import path from "path";

const app = express();

// Serve local uploads folder statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Ensure DB connection is active for each request (vital for serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
    next(err);
  }
});

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].filter(Boolean);

// Core middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Root & Health check
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "EXIM Nexus CRM Backend API is running", health: "/api/health" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "EXIM CRM API is running", timestamp: new Date() });
});

// API Routes
app.use("/api/services", servicesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/meetings", meetingsRoutes);
app.use("/api/proposals", proposalsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/company-requests", companyRequestsRoutes);
app.use("/api/collaboration-requests", collaborationRequestsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

export default app;
