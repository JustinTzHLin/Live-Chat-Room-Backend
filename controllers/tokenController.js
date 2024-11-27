import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;
const tokenController = {};

/* verify token for registration */
tokenController.verifyParamToken = async (req, res, next) => {
  // check if token exists
  const { registerToken } = req.body;
  if (!registerToken) throw new Error("A token is required for registration.");
  try {
    // verify registration token
    const { useremail } = jwt.verify(registerToken, JWT_SECRET);
    res.locals.result = { tokenVerified: true, useremail };
    return next();
  } catch (err) {
    console.log(err.message);
    // handle jwt errors
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

/* issue token after authentication */
tokenController.issueToken = async (req, res, next) => {
  // skip issue token under certain conditions
  if (res.locals.skipIssueToken) return next();
  try {
    // issue token with user data
    const { id, username, email, createdAt, lastActive } =
      res.locals.result.authenticatedUser;
    const loggedInToken = jwt.sign(
      { userId: id, username, email, createdAt, lastActive },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    // Store the token in HTTP-only cookie
    res.cookie("just.in.chat.user", loggedInToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });
  } catch (err) {
    return next({
      log: `userController.issueToken error: ${err}`,
      status: 500,
      message: { error: "Error occurred in userController.issueToken." },
    });
  }
  return next();
};

/* verify token for logged in */
tokenController.verifyLoggedInToken = async (req, res, next) => {
  // check if token exists
  const loggedInToken = req.cookies["just.in.chat.user"];
  if (!loggedInToken) {
    res.locals.result = {
      tokenVerified: false,
      errorMessage: "no token found",
    };
    return next();
  }
  try {
    // verify logged in token
    const decoded = jwt.verify(loggedInToken, JWT_SECRET);
    res.locals.result = { tokenVerified: true, user: decoded };
    return next();
  } catch (err) {
    console.log(err.message);
    // handle jwt errors
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
