const express = require("express");
const profileRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;

    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

profileRouter.post("/request/send/:toUserId", userAuth, async (req, res) => {
  const fromUserId = req.user._id;
  const { toUserId } = req.params;

  try {
    // Prevent sending request to self
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "Cannot send request to yourself." });
    }

    // Check if request already exists
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

module.exports = router;

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your profile updated successfuly`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

module.exports = profileRouter;