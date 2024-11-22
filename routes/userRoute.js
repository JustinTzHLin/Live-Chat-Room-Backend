import express from "express";
import userController from "../controllers/userController.js";
const router = express.Router();

// Check if user email exists
router.post(
  "/userExists",
  userController.checkUserExists,
  userController.sendRegistrationEmail,
  (req, res) => res.status(200).json(res.locals.result)
);

export default router;
