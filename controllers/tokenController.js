import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;
const tokenController = {};

tokenController.verifyParamToken = async (req, res, next) => {
  const { registerToken } = req.body;
  if (!registerToken) throw new Error("A token is required for registration.");
  try {
    const { useremail } = jwt.verify(registerToken, JWT_SECRET);
    res.locals.result = { tokenVerified: true, useremail };
    return next();
  } catch (err) {
    console.log(err.message);
    switch (err.message) {
      case "jwt malformed":
        res.locals.result = {
          tokenVerified: false,
          errorMessage: "jwt malformed",
        };
        return next();
      case "jwt expired":
        res.locals.result = {
          tokenVerified: false,
          errorMessage: "jwt expired",
        };
        return next();
      default:
        return next({
          log: `userController.verifyParamToken error: ${err}`,
          status: 500,
          message: {
            error: "Error occurred in userController.verifyParamToken.",
          },
        });
    }
  }
};

tokenController.issueToken = async (req, res, next) => {
  if (res.locals.skipIssueToken) return next();
  const { _id, username, email, createdAt, lastActive } =
    res.locals.result.authenticatedUser;

  // Issue token
  const loggedInToken = jwt.sign(
    { userId: _id.toString(), username, email, createdAt, lastActive },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Store the token in HTTP-only cookie
  res.cookie("just.in.chat.user", loggedInToken, {
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 60 * 60 * 1000),
  });

  return next();
};

tokenController.verifyLoggedInToken = async (req, res, next) => {
  const loggedInToken = req.cookies["just.in.chat.user"];
  if (!loggedInToken) {
    res.locals.result = {
      tokenVerified: false,
      errorMessage: "no token found",
    };
    return next();
  }
  try {
    const decoded = jwt.verify(loggedInToken, JWT_SECRET);
    console.log(decoded);
    res.locals.result = { tokenVerified: true, user: decoded };
    return next();
  } catch (err) {
    console.log(err.message);
    switch (err.message) {
      case "jwt malformed":
        res.locals.result = {
          tokenVerified: false,
          errorMessage: "jwt malformed",
        };
        return next();
      case "jwt expired":
        res.locals.result = {
          tokenVerified: false,
          errorMessage: "jwt expired",
        };
        return next();
      default:
        return next({
          log: `userController.verifyLoggedInToken error: ${err}`,
          status: 500,
          message: {
            error: "Error occurred in userController.verifyLoggedInToken.",
          },
        });
    }
  }
};

export default tokenController;
