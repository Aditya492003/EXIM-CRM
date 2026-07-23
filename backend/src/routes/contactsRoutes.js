import express from "express";
import requireAuth from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/contactsController.js";

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getContacts).post(upload.single("avatar"), createContact);
router.route("/:id")
  .get(getContact)
  .put(upload.single("avatar"), updateContact)
  .delete(deleteContact);

export default router;
