const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";
// In your backend 'routes/user.js'

userRouter.get("/user/requests/sent", userAuth, async (req, res) => {
  try {
    const sentRequests = await ConnectionRequest.find({
      fromUserId: req.user._id,
      status: "interested",
    }).populate("toUserId", "firstName lastName photoUrl about skills");

    // Map to user objects
    const users = sentRequests.map((r) => r.toUserId);
    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all the pending connection request for the loggedIn user
// Get all incoming requests (to current user)
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    }).populate("fromUserId", "firstName lastName photoUrl about skills");

    const users = requests.map(r => r.fromUserId);
    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET all accepted devfriends for current user
userRouter.get("/user/devfriends", userAuth, async (req, res) => {
  const userId = req.user._id;

  try {
    const acceptedRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ],
      status: "accepted"
    }).populate("fromUserId toUserId", "firstName lastName photoUrl about skills");

    // Extract the "other" user
    const devfriends = acceptedRequests.map((req) =>
      req.fromUserId._id.toString() === userId.toString()
        ? req.toUserId
        : req.fromUserId
    );

    res.json({ data: devfriends });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch devfriends" });
  }
});

// src/routes/user.js or profile.js
userRouter.get("/user/profile/:userId", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("firstName lastName email photoUrl");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    console.log(connectionRequests);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({ data });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId  toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
module.exports = userRouter;