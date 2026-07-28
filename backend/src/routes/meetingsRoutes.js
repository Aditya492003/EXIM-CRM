import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
  updateMeetingOutcome,
  getEmployeeMeetings,
  deleteMeeting,
} from "../controllers/meetingsController.js";

const router = express.Router();

router.use(requireAuth);

// Employee-specific route — must come before /:id routes to avoid conflict
router.get("/employee", getEmployeeMeetings);

router.route("/").get(getMeetings).post(createMeeting);
router.route("/:id").get(getMeeting).put(updateMeeting).delete(deleteMeeting);

// Inline patch routes for status and outcome
router.patch("/:id/status", updateMeetingStatus);
router.patch("/:id/outcome", updateMeetingOutcome);

export default router;
