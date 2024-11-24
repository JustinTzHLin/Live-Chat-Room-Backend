import express from "express";
import userController from "../controllers/userController.js";
import tokenController from "../controllers/tokenController.js";
import dataController from "../controllers/dataController.js";
const router = express.Router();

// Check if User Email Exists
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

// User Chat Data
router.post(
  "/getChatData",
  dataController.fetchUserFriends,
  dataController.fetchUserChats,
  (req, res) => res.status(200).json(res.locals.result)
);

export default router;
