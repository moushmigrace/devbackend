const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/user");

let io;

const initializeSocket = (server) => {
  console.log("🧠 [SOCKET] Initializing socket...");

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // ✅ Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("❌ No auth token provided"));
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // This is where it's failing:
      const user = await User.findById(decoded._id);
      if (!user) return next(new Error("❌ User not found"));
  
      socket.user = user;
      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      next(new Error("Authentication failed"));
    }
  });
  

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log("🟢 [SOCKET] Client connected:", socket.id, "User:", userId);

    // ✅ Join room
    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("-");
      socket.join(roomId);
      console.log(`👤 User ${userId} joined room ${roomId}`);
    });

    // ✅ Handle incoming messages
    socket.on("sendMessage", async ({ targetUserId, text }) => {
      const senderId = socket.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        console.error("❌ Invalid targetUserId:", targetUserId);
        return;
      }

      const roomId = [senderId, targetUserId].sort().join("-");
      console.log(`📤 [${roomId}] ${senderId} ➤ ${targetUserId}: ${text}`);

      try {
        let chat = await Chat.findOne({
          participants: { $all: [senderId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [senderId, targetUserId],
            messages: [],
          });
        }

        const newMessage = {
          senderId,
          text,
        };

        chat.messages.push(newMessage);
        await chat.save();

        console.log("💾 Message saved to DB");

        io.to(roomId).emit("messageReceived", {
          ...newMessage,
          targetUserId,
        });
      } catch (err) {
        console.error("❌ Error saving message:", err.message);
      }
    });

    // ✅ Handle disconnect
    socket.on("disconnect", () => {
      console.log("🔴 [SOCKET] Client disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
