const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aquaguard";
  try {
    await mongoose.connect(uri);
    console.log(`[AQUAGUARD] MongoDB connected -> ${uri}`);
  } catch (err) {
    console.error("[AQUAGUARD] MongoDB connection failed:", err.message);
    console.error(
      "Make sure MongoDB is running locally, or set MONGO_URI to an Atlas cluster in server/.env"
    );
    process.exit(1);
  }
}

module.exports = connectDB;
