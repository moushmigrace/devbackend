const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to DB with:", process.env.DB_CONNECTION_SECRET);
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};

module.exports = connectDB;
