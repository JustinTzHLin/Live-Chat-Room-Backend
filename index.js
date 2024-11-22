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

// Setup Server
const PORT = 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const expressServer = express();
console.log(FRONTEND_URL);

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

    // Send message to all clients, including the one that sent the message
    io.emit("receive_message", message);
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
expressServer.get("/testMongoDB", async (req, res) => {
  console.log("testMongoDB");
  try {
    const data = await User.findOne({ name: "Justin" });
    console.log(data);
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
});

// Routes
expressServer.use("/user", userRoute);

// Test
expressServer.get("/test", (req, res) => res.send("Hello World Test"));
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
