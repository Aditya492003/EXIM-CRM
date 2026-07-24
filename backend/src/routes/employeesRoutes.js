import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeesController.js";

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getEmployees).post(createEmployee);
router
  .route("/:id")
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

export default router;
