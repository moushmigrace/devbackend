const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const profileRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

// Ensure upload directory exists
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// 🔥 PATCH /profile/edit
profileRouter.patch("/edit", userAuth, upload.single("photo"), async (req, res) => {
  try {
    const fields = ["firstName", "lastName", "age", "gender", "about", "skills"];
    fields.forEach((field) => {
      if (req.body[field]) {
        if (field === "skills") {
          req.user.skills = req.body.skills.split(",").map((s) => s.trim());
        } else {
          req.user[field] = req.body[field];
        }
      }
    });

    if (req.file) {
      req.user.photoUrl = `http://localhost:7777/uploads/${req.file.filename}`;
    }
    
    
    await req.user.save();
    res.json({ message: "Profile updated successfully", data: req.user });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    res.status(500).json({ message: "Update failed: " + err.message });
  }
});


// ✅ Delete Sent Request
profileRouter.delete("/request/delete/:toUserId", userAuth, async (req, res) => {
  try {
    const request = await ConnectionRequest.findOneAndDelete({
      fromUserId: req.user._id,
      toUserId: req.params.toUserId,
      status: "interested",
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found or already deleted." });
    }

    res.json({ message: "Request deleted successfully." });
  } catch (err) {
    console.error("Delete request failed:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = profileRouter;
