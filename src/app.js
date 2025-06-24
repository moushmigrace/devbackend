const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/database");
const initializeSocket = require("./utils/socket");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/profile", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

const server = http.createServer(app);
initializeSocket(server); // ✅ Socket initialized

connectDB()
  .then(() => {
    console.log("✅ Database connection established...");
    const PORT = process.env.PORT || 7777;
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
