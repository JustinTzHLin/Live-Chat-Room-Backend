// Access to Environmental Variables
import dotenv from "dotenv";
dotenv.config();

// Import Dependencies
import express from "express";
import next from "next";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { Server } from "socket.io";

// Setup Server
const PORT = 8000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const expressServer = express();

app.prepare().then(() => {
  // CORS Middleware
  const corsOptions = {
    origin: "http://localhost:3000",
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
      origin: "http://localhost:3000",
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

  // Routes
  expressServer.get("/test", (req, res) => res.send("Hello World Test"));
  expressServer.get("/", (req, res) => res.send("Hello World"));
  expressServer.get("*", (req, res) => handle(req, res));

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
});
