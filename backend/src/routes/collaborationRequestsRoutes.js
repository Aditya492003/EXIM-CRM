import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  createCollaborationRequest,
  getCollaborationRequests,
  approveCollaborationRequest,
  rejectCollaborationRequest,
  removeCollaborator,
} from "../controllers/collaborationRequestsController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createCollaborationRequest);
router.get("/", getCollaborationRequests);
router.patch("/:id/approve", approveCollaborationRequest);
router.patch("/:id/reject", rejectCollaborationRequest);
router.delete("/remove-collaborator", removeCollaborator);

export default router;
