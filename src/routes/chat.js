const express = require("express");
const router = express.Router();
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth"); // Make sure path is correct

// GET chat between logged-in user and target user
router.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const currentUserId = req.user._id.toString();
  const targetUserId = req.params.targetUserId;

  try {
    // Check for existing chat
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, targetUserId] },
    }).populate("participants", "firstName lastName emailId photoUrl");

    // If chat doesn't exist, create it
    if (!chat) {
      chat = await Chat.create({
        participants: [currentUserId, targetUserId],
        messages: [],
      });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Failed to fetch/create chat:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
