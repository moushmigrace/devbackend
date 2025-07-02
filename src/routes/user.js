const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";


userRouter.get("/user/requests/sent", userAuth, async (req, res) => {
  try {
    const sentRequests = await ConnectionRequest.find({
      fromUserId: req.user._id,
      status: "interested",
    }).populate("toUserId", "firstName lastName photoUrl about skills");

    
    const users = sentRequests.map((r) => r.toUserId);
    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


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

// all accepted devfriends for current user
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


userRouter.get("/user/profile/:userId", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("firstName lastName email photoUrl");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//check

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