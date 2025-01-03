import mongoose from "mongoose";
import User from "../models/usersModel.js";
import Conversation from "../models/conversationsModel.js";
import Message from "../models/messagesModel.js";

const dataController = {};

dataController.fetchUserFriends = async (req, res, next) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (user) {
      res.locals.result = { friends: [] };
      for (const friendId of user.contacts) {
        const friend = await User.findById(friendId);
        if (friend) {
          const friendInfo = {
            email: friend.email,
            username: friend.username,
            friendId: friend._id,
          };
          res.locals.result.friends.push(friendInfo);
        }
      }
      return next();
    } else {
      res.locals.result = { success: false, errorMessage: "User not found." };
      res.locals.skipfetchUserChats = true;
      return next();
    }
  } catch (err) {
    return next({
      log: `dataController.fetchUserFriends error: ${err}`,
      status: 500,
      message: { error: "Error occurred in dataController.fetchUserFriends." },
    });
  }
};

dataController.fetchUserChats = async (req, res, next) => {
  if (res.locals.skipfetchUserChats) return next();
  const { userId } = req.body;
  const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
  console.log(userObjectId);
  try {
    const conversations = await Conversation.find({
      participantIDs: userObjectId,
    });
    res.locals.result.conversations = [];
    for (const conversation of conversations) {
      res.locals.result.conversations.push({
        type: conversation.type,
        roomName: conversation.roomName,
        participantIDs: conversation.participantIDs,
        messages: [],
      });
      const messages = await Message.find({ conversationId: conversation._id });
      for (const message of messages) {
        res.locals.result.conversations.at(-1).messages.push({
          senderId: message.senderId,
          content: message.content,
          timestamp: message.timestamp,
          readBy: message.readBy,
          status: message.status,
          isTransient: message.isTransient,
        });
      }
      res.locals.result.conversations
        .at(-1)
        .messages.sort((a, b) => a.timestamp - b.timestamp);
    }
    return next();
  } catch (err) {
    return next({
      log: `dataController.fetchUserChats error: ${err}`,
      status: 500,
      message: { error: "Error occurred in dataController.fetchUserChats." },
    });
  }
};

export default dataController;
