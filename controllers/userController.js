import bcrypt from "bcrypt";
import transporter from "../configs/mail.js";
import jwt from "jsonwebtoken";
import User from "../models/usersModel.js";
const SALT_WORK_FACTOR = 10;
const userController = {};

/* check if user exists in database */
userController.checkUserExists = async (req, res, next) => {
  try {
    const user = await User.exists({ email: req.body.email });
    if (user) res.locals.result = { userExists: true };
    else res.locals.result = { userExists: false };
    return next();
  } catch (err) {
    return next({
      log: `userController.checkUserExists error: ${err}`,
      status: 500,
      message: { error: "Error occurred in userController.checkUserExists." },
    });
  }
};

/* send registration email */
userController.sendRegistrationEmail = async (req, res, next) => {
  if (res.locals.result.userExists) return next();
  const { JWT_SECRET, FRONTEND_URL, SMTP_EMAIL } = process.env;
  const useremail = req.body.email;
  const token = jwt.sign({ useremail }, JWT_SECRET, { expiresIn: "1h" });
  console.log(useremail);
  const mailOptions = {
    from: SMTP_EMAIL,
    to: useremail,
    subject: "Welcome to Just In Chat!",
    text: "Thank you for signing up!",
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
    console.log(authenticatedUser);
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
      console.log(authenticatedUser);
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

// Export
export default userController;
