const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/Chat");
const { userAuth } = require("../middlewares/auth");

// Get chat by target user
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

// New route to post a message
chatRouter.post("/chat", userAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { targetUserId, text } = req.body;

    if (!targetUserId || !text) {
      return res.status(400).json({ message: "targetUserId and text are required" });
    }

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

    res.status(200).json({ message: "Message sent", chat });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear chat messages
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
