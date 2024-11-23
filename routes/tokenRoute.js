import express from "express";
import tokenController from "../controllers/tokenController.js";
const router = express.Router();

// Check if user email exists
router.post("/verifyParamToken", tokenController.verifyParamToken, (req, res) =>
  res.status(200).json(res.locals.result)
);

// Check if user already logged in
router.get(
  "/verifyLoggedInToken",
  tokenController.verifyLoggedInToken,
  (req, res) => res.status(200).json(res.locals.result)
);

export default router;
