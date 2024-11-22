import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
  conversationId: Schema.Types.ObjectId,
  senderId: Schema.Types.ObjectId,
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readBy: [Schema.Types.ObjectId],
  status: { type: String, default: "sent" }, // sent, delivered, read
  isTransient: { type: Boolean, default: false },
});

export default mongoose.model("message", messageSchema);
