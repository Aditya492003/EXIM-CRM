import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from "../controllers/dealsController.js";

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getDeals).post(createDeal);
router.route("/:id").get(getDeal).put(updateDeal).delete(deleteDeal);

// Inline patch route for stage (drag-drop kanban / dropdown)
router.patch("/:id/stage", updateDealStage);

export default router;
