import bcrypt from "bcrypt";
import transporter from "../configs/mail.js";
import jwt from "jsonwebtoken";
import User from "../models/usersModel.js";
const SALT_WORK_FACTOR = 10;
const userController = {};

/* check if user email exists in database */
userController.checkUserEmailExists = async (req, res, next) => {
  try {
    const user = await User.exists({ email: req.body.email });
    if (user) res.locals.result = { userExists: true };
    else res.locals.result = { userExists: false };
    return next();
  } catch (err) {
    return next({
      log: `userController.checkUserEmailExists error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.checkUserEmailExists.",
      },
    });
  }
};

/* send registration email */
userController.sendRegistrationEmail = async (req, res, next) => {
  if (res.locals.result.userExists) return next();
  const { JWT_SECRET, FRONTEND_URL, SMTP_EMAIL } = process.env;
  const useremail = req.body.email;
  const token = jwt.sign({ useremail }, JWT_SECRET, { expiresIn: "1h" });
  const mailOptions = {
    from: SMTP_EMAIL,
    to: useremail,
    subject: "Welcome to Just In Chat!",
    html:
      "<h1>Welcome to Just In Chat!</h1>" +
      "<p>We're thrilled to have you join our community of chat enthusiasts and instant communicators!</p>" +
      "<p>To complete your signup and start chatting, please click the link below:</p>" +
      `<p><a href="${FRONTEND_URL}?registerToken=${token}">Complete Signup</a></p>` +
      "<p>This link is only available for 1 hour. After that, you may need to request a new signup link if the original one expires.</p>" +
      `<p>If you have any questions or need assistance, don't hesitate to reach out to us at ${SMTP_EMAIL}.</p>` +
      "<p>Happy chatting!</p>",
  };
  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    res.locals.result.emailSent = true;
    return next();
  } catch (err) {
    return next({
      log: `userController.sendRegistrationEmail error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.sendRegistrationEmail.",
      },
    });
  }
};

/* create new user */
userController.createUser = async (req, res, next) => {
  if (res.locals.result.userExists) {
    res.locals.skipIssueToken = true;
    return next();
  }
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    const authenticatedUser = await user.save();
    res.locals.result.userCreated = true;
    res.locals.result.authenticatedUser = authenticatedUser;
    return next();
  } catch (err) {
    return next({
      log: `userController.createUser error: ${err}`,
      status: 500,
      message: { error: "Error occurred in userController.createUser." },
    });
  }
};

/* verify user login */
userController.verifyUser = async (req, res, next) => {
  if (!res.locals.result.userExists) {
    res.locals.skipIssueToken = true;
    return next();
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const authenticatedUser = await User.findOneAndUpdate(
        { email },
        { lastActive: Date.now() },
        { new: true }
      );
      res.locals.result.userVerified = true;
      res.locals.result.authenticatedUser = authenticatedUser;
      if (res.locals.result.authenticatedUser.twoFactor !== "none")
        res.locals.generateOtp = true;
      return next();
    } else {
      res.locals.result.userVerified = false;
      res.locals.skipIssueToken = true;
      return next();
    }
  } catch (err) {
    return next({
      log: `userController.verifyUser error: ${err}`,
      status: 500,
      message: { error: "Error occurred in userController.verifyUser." },
    });
  }
};

/* search user by email or JIC Id */
userController.searchUser = async (req, res, next) => {
  if (!res.locals.result.tokenVerified) return next();
  const { email, jicId } = req.body;
  try {
    let user;
    if (email) user = await User.findOne({ email });
    else if (jicId) user = await User.findOne({ jicID: jicId });
    if (user)
      res.locals.result = {
        userExists: true,
        searchedUser: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      };
    else res.locals.result = { userExists: false };
    return next();
  } catch (err) {
    return next({
      log: `userController.searchUser error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.searchUser.",
      },
    });
  }
};

/* change password */
userController.changePassword = async (req, res, next) => {
  if (!res.locals.result.tokenVerified) {
    res.locals.skipIssueToken = true;
    return next();
  }
  const { userId } = res.locals.result.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (isPasswordValid) {
      const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true }
      );
      res.locals.result = {
        passwordChanged: true,
        authenticatedUser: updatedUser,
      };
      return next();
    } else {
      res.locals.result = {
        passwordChanged: false,
        errorMessage: "incorrect password",
      };
      res.locals.skipIssueToken = true;
      return next();
    }
  } catch (err) {
    return next({
      log: `userController.changePassword error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.changePassword.",
      },
    });
  }
};

// change username
userController.updateUsername = async (req, res, next) => {
  if (!res.locals.result.tokenVerified) {
    res.locals.skipIssueToken = true;
    return next();
  }
  const { userId } = res.locals.result.user;
  const { newUsername } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true }
    );
    res.locals.result = {
      usernameChanged: true,
      authenticatedUser: updatedUser,
    };
    return next();
  } catch (err) {
    return next({
      log: `userController.updateUsername error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.updateUsername.",
      },
    });
  }
};

/* send login otp email */
userController.sendLoginOTPEmail = async (req, res, next) => {
  if (res.locals.result.authenticatedUser.twoFactor === "none") return next();
  const { SMTP_EMAIL } = process.env;
  const useremail = res.locals.result.authenticatedUser.email;
  const otpCode = res.locals.otpCode;
  const mailOptions = {
    from: SMTP_EMAIL,
    to: useremail,
    subject: "Your Just In Chat OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: black;">Just In Chat</h2>
        <p>Hi there,</p>
        <p>Use the OTP code below to sign in to your account:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="
            display: inline-block;
            font-size: 32px;
            font-weight: bold;
            color: white;
            background: black;
            padding: 10px 20px;
            border-radius: 5px;
          ">
            ${otpCode}
          </span>
        </div>
        <p>If you did not request this code, please ignore this email.</p>
        <p>Thanks,</p>
        <p>The Just In Chat Team</p>
      </div>
    `,
  };
  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    res.locals.result.emailSent = true;
    return next();
  } catch (err) {
    return next({
      log: `userController.sendRegistrationEmail error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.sendRegistrationEmail.",
      },
    });
  }
};

userController.change2FA = async (req, res, next) => {
  if (!res.locals.result.tokenVerified) {
    res.locals.skipIssueToken = true;
    return next();
  }
  const { userId } = res.locals.result.user;
  const { twoFactor } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { twoFactor },
      { new: true }
    );
    res.locals.result = {
      twoFactorChanged: true,
      authenticatedUser: updatedUser,
    };
    return next();
  } catch (err) {
    return next({
      log: `userController.change2FA error: ${err}`,
      status: 500,
      message: {
        error: "Error occurred in userController.change2FA.",
      },
    });
  }
};

// Export
export default userController;
