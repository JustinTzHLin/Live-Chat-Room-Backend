import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  jicID: { type: String, unique: true },
  authProvider: { type: String, default: "email" }, // email, google
  contacts: { type: [Schema.Types.ObjectId], default: [] },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

export default mongoose.model("user", userSchema);
