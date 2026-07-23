import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
  deleteMeeting,
} from "../controllers/meetingsController.js";

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getMeetings).post(createMeeting);
router.route("/:id").get(getMeeting).put(updateMeeting).delete(deleteMeeting);

// Inline patch route for status
router.patch("/:id/status", updateMeetingStatus);

export default router;
