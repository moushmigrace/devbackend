const express = require("express");
const profileRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const ConnectionRequest = require("../models/connectionRequest"); // ✅ Required import

// View profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// Send request (⚠️ this should be in request.js ideally, but okay here for now)
profileRouter.post("/request/send/:toUserId", userAuth, async (req, res) => {
  const fromUserId = req.user._id;
  const { toUserId } = req.params;

  try {
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "Cannot send request to yourself." });
    }

    const existing = await ConnectionRequest.findOne({ fromUserId, toUserId });
    if (existing) {
      return res.status(400).json({ message: "Request already sent." });
    }

    const newRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status: "interested",
    });

    await newRequest.save();
    res.json({ message: "Request sent successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit profile
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your profile updated successfully`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

profileRouter.patch("/request/accept/:fromUserId", userAuth, async (req, res) => {
  try {
    const request = await ConnectionRequest.findOneAndUpdate(
      {
        fromUserId: req.params.fromUserId,
        toUserId: req.user._id,
        status: "interested",
      },
      { status: "accepted" },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: "Request not found." });

    res.json({ message: "Request accepted." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});




module.exports = profileRouter; // ✅ Correct export
