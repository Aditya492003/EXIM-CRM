import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";


import connectDb from "./config/db.js";

const app = express();

//db connection 
connectDb();

//Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes (Phase 4)
// app.use("/api/services", servicesRoutes);
// app.use("/api/companies", companiesRoutes);
// app.use("/api/contacts", contactsRoutes);
// app.use("/api/leads", leadsRoutes);
// app.use("/api/deals", dealsRoutes);
// app.use("/api/meetings", meetingsRoutes);
// app.use("/api/proposals", proposalsRoutes);
// app.use("/api/dashboard", dashboardRoutes);

// Global Error Handler (Phase 3)
// app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
});
