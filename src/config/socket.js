import express from "express";
import http from "http";
import { Server } from "socket.io";
import { adminAuth } from "./firebaseAdmin.js";
import { getDB } from "./mongodb.js";

const app = express();
const server = http.createServer(app);

const allowOrigin =
  process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: [allowOrigin],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = new Map();

const getReceiverSocketId = (userId) => {
  return Array.from(userSocketMap.get(String(userId)) || []);
};


io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }
    const decodedToken = await adminAuth.verifyIdToken(
      token,
      true
    );
    const user = await getDB()
      .collection("users")
      .findOne({
        firebaseUid: decodedToken.uid,
      });
    if (!user) {
      return next(new Error("User not found"));
    }
    socket.data.userId = user._id.toString();
    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error.code || error.message
    );
    next(new Error("Unauthorized"));
  }
});


io.on("connection", (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);

  console.log("User connected:", userId);
  console.log("Socket ID:", socket.id);

  const socketIds = userSocketMap.get(userId) || new Set();

  socketIds.add(socket.id);
  userSocketMap.set(userId, socketIds);

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    const socketIds = userSocketMap.get(userId);
    if (socketIds) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        userSocketMap.delete(userId);
      }
    }
  });
});


export { app, server, io, getReceiverSocketId };