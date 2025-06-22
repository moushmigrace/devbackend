const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const connectDB = require("./config/database");
const initializeSocket = require("./utils/socket");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
// const paymentRouter = require("./routes/payment");

require("./utils/cronjob");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
// app.use("/", paymentRouter);

// Socket Server
const server = http.createServer(app);
initializeSocket(server);

// Database Connection and Server Start
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
