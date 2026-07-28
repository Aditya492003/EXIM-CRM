import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import {
  getEmployees,
  getEmployee,
  getEmployeeProfile,
  inviteEmployee,
  updateEmployee,
  deleteEmployee,
  syncEmployee,
  updateWorkingStatus
} from "../controllers/employeesController.js";

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getEmployees);
router.route("/me").get(getEmployeeProfile);
router.route("/invite").post(inviteEmployee);
router.route("/sync").post(syncEmployee);
router.route("/status").patch(updateWorkingStatus);

router
  .route("/:id")
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

export default router;
