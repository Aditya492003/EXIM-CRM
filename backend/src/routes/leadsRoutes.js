import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  updateLeadNotes,
  toggleFavorite,
  deleteLead,
  exportLeadsCSV,
  convertLeadToDeal,
} from "../controllers/leadsController.js";

const router = express.Router();

router.use(requireAuth);

// Specific routes before /:id
router.get("/export/csv", exportLeadsCSV);

router.route("/").get(getLeads).post(createLead);
router.route("/:id").get(getLead).put(updateLead).delete(deleteLead);

// Lead conversion to deal
router.post("/:id/convert", convertLeadToDeal);

// Inline patch routes
router.patch("/:id/status", updateLeadStatus);
router.patch("/:id/notes", updateLeadNotes);
router.patch("/:id/favorite", toggleFavorite);

export default router;
