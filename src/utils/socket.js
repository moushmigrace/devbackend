const { Server } = require("socket.io");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    socket.on("joinChat", ({ userId, targetUserId, firstName }) => {
      const room = [userId, targetUserId].sort().join("_");
      socket.join(room);
      console.log(`📥 ${firstName} joined room ${room}`);
    });

    socket.on("sendMessage", (msg) => {
      const room = [msg.userId, msg.targetUserId].sort().join("_");
      socket.to(room).emit("messageReceived", msg);
      console.log("📤 Message sent to room:", room, msg);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};

// ✅ Make sure this is how you export it
module.exports = initializeSocket;
