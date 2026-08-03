import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  createCompanyRequest,
  getCompanyRequests,
  approveCompanyRequest,
  rejectCompanyRequest,
} from "../controllers/companyRequestsController.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createCompanyRequest);
router.get("/", getCompanyRequests);
router.patch("/:id/approve", approveCompanyRequest);
router.patch("/:id/reject", rejectCompanyRequest);

export default router;
