const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/Chat");

// ✅ Destructure userAuth correctly from object
const { userAuth } = require("../middlewares/auth");

// GET /chat/:id
chatRouter.get("/chat/:id", userAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const targetUserId = req.params.id;

    const chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).lean();

    if (!chat) {
      return res.status(200).json({ messages: [], participants: [userId, targetUserId] });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("❌ Failed to fetch chat:", err);
    res.status(500).json({ message: "Server error" });
  }
});

chatRouter.delete("/chat/:id", userAuth, async (req, res) => {
  const userId = req.user._id.toString();
  const targetUserId = req.params.id;

  const chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  });

  if (chat) {
    chat.messages = [];
    await chat.save();
  }

  res.status(200).json({ message: "Chat cleared" });
});


module.exports = chatRouter;
