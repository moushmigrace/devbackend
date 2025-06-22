// src/utils/socket.js

const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId.toString(), targetUserId.toString()].sort().join("$"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinChat", ({ userId, targetUserId, firstName }) => {
      if (!userId || !targetUserId) {
        console.warn("❗ Missing userId or targetUserId in joinChat event.");
        return;
      }

      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
      console.log(`${firstName || "User"} joined Room: ${roomId}`);
    });

    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, text }) => {
      if (!userId || !targetUserId || !text) {
        console.warn("❗ Incomplete message data received.");
        return;
      }

      const roomId = getSecretRoomId(userId, targetUserId);

      try {
        let chat = await Chat.findOne({ participants: { $all: [userId, targetUserId] } });
        if (!chat) {
          chat = new Chat({ participants: [userId, targetUserId], messages: [] });
        }

        const newMessage = { senderId: userId, text };
        chat.messages.push(newMessage);
        await chat.save();

        io.to(roomId).emit("messageReceived", {
          firstName,
          lastName,
          senderId: userId,
          text,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Message error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
