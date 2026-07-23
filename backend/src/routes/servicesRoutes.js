import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "../controllers/servicesController.js";

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getServices).post(createService);
router.route("/:id").get(getService).put(updateService).delete(deleteService);

export default router;
