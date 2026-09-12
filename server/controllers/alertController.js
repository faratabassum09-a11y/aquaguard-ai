const AlertSubscription = require("../models/AlertSubscription");
const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRisk } = require("../services/riskService");
const { dispatchCriticalAlert, LIVE_MODE, CHANNEL_LIVE } = require("../services/alertDispatchService");
const { driversFromMeasurement } = require("./lakeController");

async function subscribe(req, res) {
  try {
    const { phoneNumber, email, channel, lakeId } = req.body;
    if (!channel || !["sms", "whatsapp", "email"].includes(channel)) {
      return res.status(400).json({ error: "channel must be one of: sms, whatsapp, email" });
    }

    let update = { channel, lakeId: lakeId || null, active: true, phoneNumber: null, email: null };

    if (channel === "email") {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "A valid email address is required" });
      }
      update.email = email;
    } else {
      if (!phoneNumber || !/^\+\d{8,15}$/.test(phoneNumber)) {
        return res.status(400).json({ error: "phoneNumber must be in E.164 format, e.g. +919876543210" });
      }
      update.phoneNumber = phoneNumber;
    }

    // Upsert on (channel, lakeId) so re-subscribing (e.g. fixing a typo'd
    // number/email) REPLACES the previous entry instead of accumulating
    // stale duplicates that would still receive dispatch attempts forever.
    const sub = await AlertSubscription.findOneAndUpdate(
      { channel, lakeId: lakeId || null },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ subscription: sub, liveMode: CHANNEL_LIVE[channel] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listSubscriptions(req, res) {
  try {
    const subs = await AlertSubscription.find({ active: true }).populate("lakeId", "name");
    res.json({ subscriptions: subs, liveMode: LIVE_MODE });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Manually trigger a critical-risk alert dispatch for a lake (also called
 * automatically by the live-alert heartbeat when a lake's real computed
 * risk is CRITICAL). Sends to anyone subscribed to this lake specifically,
 * plus anyone subscribed to "all lakes" (lakeId: null).
 */
async function triggerAlert(req, res) {
  try {
    const { lakeId } = req.params;
    const lake = await Lake.findById(lakeId);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId }).sort({ date: 1 });
    if (!measurements.length) return res.status(400).json({ error: "No measurements for this lake" });
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);

    const subs = await AlertSubscription.find({
      active: true,
      $or: [{ lakeId: null }, { lakeId: lake._id }],
    });

    const dispatch = await dispatchCriticalAlert(subs, lake, risk);
    res.json({ lake: { id: lake._id, name: lake.name }, risk, dispatch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { subscribe, listSubscriptions, triggerAlert };
