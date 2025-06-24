const { Server } = require("socket.io");
const Chat = require("../models/Chat"); // ✅ Correct path to your Chat model
const mongoose = require("mongoose");

let io;

const initializeSocket = (server) => {
  console.log("🧠 [SOCKET] Initializing socket...");

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 [SOCKET] New client connected:", socket.id);

    socket.on("joinChat", ({ userId, targetUserId, firstName }) => {
      const roomId = [userId, targetUserId].sort().join("-");
      socket.join(roomId);
      console.log(`👤 ${firstName} joined room ${roomId}`);
    });

    socket.on("sendMessage", async (msg) => {
      console.log("📨 Incoming msg:", msg);
      const { userId, targetUserId, text } = msg;

      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(targetUserId)
      ) {
        console.error("❌ Invalid userId or targetUserId:", userId, targetUserId);
        return;
      }

      const roomId = [userId, targetUserId].sort().join("-");
      console.log(`📤 Message sent to room ${roomId}: ${text}`);

      try {
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        chat.messages.push({
          senderId: userId,
          text,
        });

        await chat.save();
        console.log("💾 Message saved to DB");
      } catch (err) {
        console.error("❌ Error saving message:", err.message);
      }

      io.to(roomId).emit("messageReceived", {
        ...msg,
        senderId: userId, // ensure recipient knows who sent it
      });
    });

    socket.on("disconnect", () => {
      console.log("🔴 [SOCKET] Client disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
