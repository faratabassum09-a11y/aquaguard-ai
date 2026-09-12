const mongoose = require("mongoose");

const AlertSubscriptionSchema = new mongoose.Schema(
  {
    // Exactly one of phoneNumber / email is populated, depending on channel.
    phoneNumber: { type: String, default: null }, // E.164 format, e.g. +919876543210 - required for sms/whatsapp
    email: { type: String, default: null }, // required for the email channel
    channel: { type: String, enum: ["sms", "whatsapp", "email"], required: true },
    lakeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lake", default: null }, // null = all lakes
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlertSubscription", AlertSubscriptionSchema);
