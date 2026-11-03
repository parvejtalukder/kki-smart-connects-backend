import express from "express";
import http from "http";
import { Server } from "socket.io";

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
  return userSocketMap.get(userId) || [];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    const socketIds = userSocketMap.get(userId) || new Set();

    socketIds.add(socket.id);
    userSocketMap.set(userId, socketIds);
  }

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    if (userId) {
      const socketIds = userSocketMap.get(userId);

      if (socketIds) {
        socketIds.delete(socket.id);

        if (socketIds.size === 0) {
          userSocketMap.delete(userId);
        } else {
          userSocketMap.set(userId, socketIds);
        }
      }
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { app, server, io, getReceiverSocketId };