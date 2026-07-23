import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  toggleFavorite,
  deleteLead,
  exportLeadsCSV,
} from "../controllers/leadsController.js";

const router = express.Router();

router.use(requireAuth);

// Specific routes before /:id
router.get("/export/csv", exportLeadsCSV);

router.route("/").get(getLeads).post(createLead);
router.route("/:id").get(getLead).put(updateLead).delete(deleteLead);

// Inline patch routes
router.patch("/:id/status", updateLeadStatus);
router.patch("/:id/favorite", toggleFavorite);

export default router;
