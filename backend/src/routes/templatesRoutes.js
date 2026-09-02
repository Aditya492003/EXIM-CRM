import express from "express";
import multer from "multer";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
} from "../controllers/templatesController.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

const router = express.Router();

router.use(requireAuth);

router.route("/")
  .get(getTemplates)
  .post(upload.single("file"), createTemplate);

router.route("/:id")
  .delete(deleteTemplate);

export default router;
