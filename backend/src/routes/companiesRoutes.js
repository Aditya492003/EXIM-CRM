import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  exportCompaniesCSV,
} from "../controllers/companiesController.js";

const router = express.Router();

router.use(requireAuth);

// CSV export must be before /:id to avoid "export" being treated as an id param
router.get("/export/csv", exportCompaniesCSV);

router.route("/").get(getCompanies).post(upload.single("logo"), createCompany);
router.route("/:id")
  .get(getCompany)
  .put(upload.single("logo"), updateCompany)
  .delete(deleteCompany);

export default router;
