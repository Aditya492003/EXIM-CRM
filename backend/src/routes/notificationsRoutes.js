import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  sendNotification,
  getMyNotifications,
  markAsRead,
  deleteNotification,
  saveFCMToken,
  deleteFCMToken,
} from "../controllers/notificationsController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/fcm-token", saveFCMToken);
router.delete("/fcm-token", deleteFCMToken);

router.post("/", sendNotification);
router.get("/my", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
