import bcrypt from "bcryptjs";
import transporter from "../configs/mail.js";
import jwt from "jsonwebtoken";

import User from "../models/usersModel.js";

const userController = {};

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

userController.sendRegistrationEmail = async (req, res, next) => {
  if (res.locals.result.userExists) return next();

  const { JWT_SECRET, FRONTEND_URL, SMTP_EMAIL } = process.env;
  const useremail = req.body.email;
  const token = jwt.sign({ useremail }, JWT_SECRET, { expiresIn: "1h" });
  const mailOptions = {
    from: SMTP_EMAIL,
    to: useremail,
    subject: "Welcome to Just In Chat!",
    text: "Thank you for signing up!",
    html:
      "<h1>Welcome to Just In Chat!</h1>" +
      "<p>We're thrilled to have you join our community of chat enthusiasts and instant communicators!</p>" +
      "<p>To complete your signup and start chatting, please click the link below:</p>" +
      `<p><a href="${FRONTEND_URL}?token=${token}">Complete Signup</a></p>` +
      "<p>This link is only available for 1 hour. After that, you may need to request a new signup link if the original one expires.</p>" +
      `<p>If you have any questions or need assistance, don't hesitate to reach out to us at ${SMTP_EMAIL}.</p>` +
      "<p>Happy chatting!</p>",
  };

  try {
    const verifyConnectionResult = await transporter.verify();
    console.log("Verify connection result:", verifyConnectionResult);

    const sendEmailResult = await transporter.sendMail(mailOptions);
    console.log("Send email result:", sendEmailResult);

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

// Export
export default userController;
