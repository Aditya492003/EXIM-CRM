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
  importCompaniesBulk,
} from "../controllers/companiesController.js";

const router = express.Router();

router.use(requireAuth);

// Special routes before /:id
router.get("/export/csv", exportCompaniesCSV);
router.post("/bulk", importCompaniesBulk);

router.route("/").get(getCompanies).post(upload.single("logo"), createCompany);
router.route("/:id")
  .get(getCompany)
  .put(upload.single("logo"), updateCompany)
  .delete(deleteCompany);

export default router;
