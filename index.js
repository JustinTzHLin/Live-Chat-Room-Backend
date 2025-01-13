// Access to Environmental Variables
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

// Import Dependencies
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { Server } from "socket.io";
import User from "./models/usersModel.js";

// Import Routes
import userRoute from "./routes/userRoute.js";
import tokenRoute from "./routes/tokenRoute.js";
import chatRoute from "./routes/chatRoute.js";

// Setup Server
const PORT = 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const expressServer = express();

// CORS Middleware
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};
expressServer.use(cors(corsOptions));

// Other Middleware
expressServer.use(cookieParser());
expressServer.use(express.json());
expressServer.use(express.urlencoded({ extended: true }));

// Socket.io server
const server = createServer(expressServer);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Socket.io Events
io.on("connection", (socket) => {
  console.log("Client connected");

  // Handle messages from the client
  socket.on("send_message", (message) => {
    console.log("Message received:", message);

    // Send message to all clients, including the sender
    io.emit("receive_message", message);
  });

  // Handle sent friend request
  socket.on("send_friend_request", (friendRequest) => {
    console.log("Friend request received:", friendRequest);

    // Send friend request to all clients, including the sender
    io.emit("receive_friend_request", friendRequest);
  });

  // Handle rejected or canceld friend request
  socket.on("cancel_reject_friend_request", (friendRequest) => {
    console.log("Friend request canceled or rejected:", friendRequest);

    // Cancel or reject friend request from all clients, including the canceler or rejecter
    io.emit("canceled_rejected_friend_request", friendRequest);
  });

  // Handle accepted friend request
  socket.on("accept_friend_request", (friendRequest) => {
    console.log("Friend request accepted:", friendRequest);

    // Accept friend request from all clients, including the accepter
    io.emit("accepted_friend_request", friendRequest);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

// Routes
expressServer.use("/user", userRoute);
expressServer.use("/token", tokenRoute);
expressServer.use("/chat", chatRoute);

expressServer.get("/", (req, res) => res.send("Hello World"));
expressServer.get("*", (req, res, next) =>
  next({
    log: "Express error handler caught unknown endpoint",
    status: 404,
    message: { err: "Endpoint not found" },
  })
);

// Express global error handler
expressServer.use((err, req, res, next) => {
  const defaultObj = {
    log: "Express error handler caught unknown middleware error",
    status: 500,
    message: { err: "An error occurred" },
  };
  const errObj = Object.assign({}, defaultObj, err);
  console.log(errObj.log);
  return res.status(errObj.status).json(errObj.message);
});

// Start Server
server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(
    `🚀 Socket server launching on http://localhost:${PORT} under ${process.env.NODE_ENV} mode.`
  );
});
