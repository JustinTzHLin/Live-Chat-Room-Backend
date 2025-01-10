import express from "express";
import userController from "../controllers/userController.js";
import tokenController from "../controllers/tokenController.js";
import dataController from "../controllers/dataController.js";
import friendRequestController from "../controllers/friendRequestController.js";
const router = express.Router();

// Check if User Email Exists
router.post(
  "/registerCheck",
  userController.checkUserEmailExists,
  userController.sendRegistrationEmail,
  (req, res) => res.status(200).json(res.locals.result)
);

// User Register
router.post(
  "/signUp",
  userController.checkUserEmailExists,
  userController.createUser,
  tokenController.issueToken,
  (req, res) => res.status(200).json(res.locals.result)
);

// User Login
router.post(
  "/signIn",
  userController.checkUserEmailExists,
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

// Search User
router.post(
  "/searchUser",
  tokenController.verifyLoggedInToken,
  userController.searchUser,
  (req, res) => res.status(200).json(res.locals.result)
);

// Send Friend Request
router.post(
  "/sendFriendRequest",
  tokenController.verifyLoggedInToken,
  friendRequestController.sendFriendRequest,
  (req, res) => res.status(200).json(res.locals.result)
);

// Fetch Friend Requests
router.get(
  "/fetchFriendRequests",
  tokenController.verifyLoggedInToken,
  friendRequestController.fetchFriendRequests,
  (req, res) => res.status(200).json(res.locals.result)
);

// Friend Request Actions
router.post(
  "/friendRequestAction",
  tokenController.verifyLoggedInToken,
  friendRequestController.friendRequestAction,
  (req, res) => res.status(200).json(res.locals.result)
);

// Change Password
router.post(
  "/changePassword",
  tokenController.verifyLoggedInToken,
  userController.changePassword,
  tokenController.issueToken,
  (req, res) => res.status(200).json(res.locals.result)
);

// Change Username
router.post(
  "/updateUsername",
  tokenController.verifyLoggedInToken,
  userController.updateUsername,
  tokenController.issueToken,
  (req, res) => res.status(200).json(res.locals.result)
);

export default router;
