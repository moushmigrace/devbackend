const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
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

  // ✅ Socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("❌ No auth token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    console.log("🟢 [SOCKET] Connected:", socket.id, "User:", userId);

    // ✅ Join chat room
    socket.on("joinChat", ({ targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("-");
      socket.join(roomId);
      console.log(`👥 User ${userId} joined room ${roomId}`);
    });

    // ✅ Send message
    socket.on("sendMessage", async ({ targetUserId, text }) => {
      const senderId = socket.user._id;
      const newMessage = {
        senderId,
        text,
        timestamp: new Date(),
      };

      let chat = await Chat.findOne({
        participants: { $all: [senderId, targetUserId] },
      });

      if (!chat) {
        chat = new Chat({
          participants: [senderId, targetUserId],
          messages: [newMessage],
        });
      } else {
        chat.messages.push(newMessage);
      }

      await chat.save();

      const roomId = [senderId.toString(), targetUserId.toString()].sort().join("-");
      io.to(roomId).emit("messageReceived", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("🔴 [SOCKET] Disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;
