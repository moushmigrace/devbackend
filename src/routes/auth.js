const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    
    validateSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;

    
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);

    // instance of the User model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
    });

    res.json({ message: "User Added successfully!", data: savedUser });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = await user.getJWT();

    // ✅ Send token in response, not just cookie
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: false, // set to true in production (with https)
    });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailId,
      },
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});


authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout Successful!!");
});

module.exports = authRouter;