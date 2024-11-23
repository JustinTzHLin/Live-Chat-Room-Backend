import express from "express";
import userController from "../controllers/userController.js";
import tokenController from "../controllers/tokenController.js";
const router = express.Router();

// Check if user email exists
router.post(
  "/userExists",
  userController.checkUserExists,
  userController.sendRegistrationEmail,
  (req, res) => res.status(200).json(res.locals.result)
);

// User Register
router.post(
  "/signUp",
  userController.checkUserExists,
  userController.createUser,
  tokenController.issueToken,
  (req, res) => res.status(200).json(res.locals.result)
);

// User Login
router.post(
  "/signIn",
  userController.checkUserExists,
  userController.verifyUser,
  tokenController.issueToken,
  (req, res) => res.status(200).json(res.locals.result)
);

export default router;
