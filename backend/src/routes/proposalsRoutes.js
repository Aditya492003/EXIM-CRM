import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getProposals,
  getProposal,
  createProposal,
  sendProposalDirectEmail,
  updateProposal,
  updateProposalStatus,
  deleteProposal,
} from "../controllers/proposalsController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/send-email", upload.single("attachment"), sendProposalDirectEmail);

router.route("/").get(getProposals).post(upload.single("attachment"), createProposal);
router.route("/:id")
  .get(getProposal)
  .put(upload.single("attachment"), updateProposal)
  .delete(deleteProposal);

// Inline patch route for status
router.patch("/:id/status", updateProposalStatus);

export default router;
