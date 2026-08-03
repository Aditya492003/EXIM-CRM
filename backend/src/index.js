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

import path from "path";

const app = express();

// Serve local uploads folder statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// DB connection
connectDb();

// Core middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "EXIM CRM API is running" });
});

// API Routes
app.use("/api/services",   servicesRoutes);
app.use("/api/companies",  companiesRoutes);
app.use("/api/contacts",   contactsRoutes);
app.use("/api/leads",      leadsRoutes);
app.use("/api/deals",      dealsRoutes);
app.use("/api/meetings",   meetingsRoutes);
app.use("/api/proposals",  proposalsRoutes);
app.use("/api/dashboard",  dashboardRoutes);
app.use("/api/employees",  employeesRoutes);
app.use("/api/templates",  templatesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/company-requests", companyRequestsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
});
