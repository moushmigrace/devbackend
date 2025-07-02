const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 50,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address: " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter a Strong Password: " + value);
        }
      },
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: `{VALUE} is not a valid gender type`,
      },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    membershipType: {
      type: String,
    },
    photoUrl: {
      type: String,
      default: "https://geographyandyou.com/images/user-profile.png",
      
    },
    about: {
      type: String,
      default: "This is a default about of the user!",
    },
    skills: {
      type: [String],
      default: [],
    },
    projectsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate JWT token


userSchema.methods.getJWT = function () {
  const user = this;

  const token = jwt.sign(
    { _id: user._id },               // ✅ payload
    process.env.JWT_SECRET,         // ✅ secret ("hello" in your .env)
    { expiresIn: "7d" }             // ✅ token duration
  );

  return token;
};


// Validate user-entered password against hashed one
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    passwordHash
  );

  return isPasswordValid;
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

