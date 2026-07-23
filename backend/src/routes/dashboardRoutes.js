import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getStats,
  getLeadGrowth,
  getRevenue,
  getDealsByStage,
  getLeadSources,
  getTeamPerformance,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/stats", getStats);
router.get("/lead-growth", getLeadGrowth);
router.get("/revenue", getRevenue);
router.get("/deals-by-stage", getDealsByStage);
router.get("/lead-sources", getLeadSources);
router.get("/performance", getTeamPerformance);

export default router;
