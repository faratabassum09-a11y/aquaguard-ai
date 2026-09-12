/**
 * One-off cleanup utility: wipes all alert subscriptions so you can
 * re-subscribe fresh with the correct phone number. Safe to run any time -
 * it only touches the AlertSubscription collection, nothing else.
 *
 * Usage (from the server/ folder): node scripts/clear-alert-subscriptions.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const AlertSubscription = require("../models/AlertSubscription");

async function main() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aquaguard");
  const result = await AlertSubscription.deleteMany({});
  console.log(`Deleted ${result.deletedCount} alert subscription(s). Clean slate ready.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
});
