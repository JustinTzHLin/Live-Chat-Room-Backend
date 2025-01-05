import mongoose from "mongoose";
import Message from "../models/messagesModel.js";

const chatController = {};

chatController.sendMessage = async (req, res, next) => {
  if (!res.locals.result.tokenVerified) return next();
  const { senderId, conversationId, content } = req.body;
  try {
    const newMessage = await Message.create({
      senderId: mongoose.Types.ObjectId.createFromHexString(senderId),
      conversationId:
        mongoose.Types.ObjectId.createFromHexString(conversationId),
      content,
    });
    res.locals.result = { success: true, newMessage };
    return next();
  } catch (err) {
    return next({
      log: `chatController.sendMessage error: ${err}`,
      status: 500,
      message: { error: "Error occurred in chatController.sendMessage." },
    });
  }
};

export default chatController;
