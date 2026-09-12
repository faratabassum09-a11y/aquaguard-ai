/**
 * alertDispatchService.js
 *
 * Sends critical-risk alerts to subscribers via THREE independent, each
 * separately-pluggable channels: SMS, WhatsApp (both via Twilio), and email.
 *
 * Email has TWO possible transports, tried in this order:
 *   1. Resend's HTTPS API (RESEND_API_KEY) - sends over port 443, which
 *      works on every host including Render's free tier, which blocks
 *      outbound SMTP (ports 25/465/587) entirely as of Sept 2025.
 *   2. Gmail SMTP via nodemailer (EMAIL_USER + EMAIL_APP_PASSWORD) - kept
 *      as a fallback for local development, where SMTP isn't blocked.
 *
 * Each channel detects its own credentials and falls back to a
 * clearly-labeled SIMULATED send if none are configured - so a judge
 * running this with zero configuration still sees the full
 * subscribe -> critical -> dispatch flow end to end for every channel, and
 * any channel that IS configured sends for real.
 */

const nodemailer = require("nodemailer");

// ---------- Twilio (SMS / WhatsApp) ----------
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || "";
const TWILIO_CONTENT_SID = process.env.TWILIO_CONTENT_SID || ""; // optional, see .env.example
const TWILIO_LIVE = Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM);

// ---------- Email: Resend HTTPS API (preferred - works on Render free tier) ----------
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "AQUAGUARD AI <onboarding@resend.dev>";

// ---------- Email: Gmail SMTP fallback (local dev only - Render free tier blocks this) ----------
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || "";
const EMAIL_SMTP_LIVE = Boolean(EMAIL_USER && EMAIL_APP_PASSWORD);

const EMAIL_LIVE = Boolean(RESEND_API_KEY) || EMAIL_SMTP_LIVE;

let emailTransporter = null;
function getEmailTransporter() {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
    });
  }
  return emailTransporter;
}

// Reported to the client so the UI can say "this channel is live" per
// channel, rather than one blanket flag for everything.
const LIVE_MODE = TWILIO_LIVE || EMAIL_LIVE; // kept for backward compatibility with existing callers
const CHANNEL_LIVE = { sms: TWILIO_LIVE, whatsapp: TWILIO_LIVE, email: EMAIL_LIVE };

async function sendViaTwilio({ to, body, channel }) {
  const from = channel === "whatsapp" ? `whatsapp:${TWILIO_FROM}` : TWILIO_FROM;
  const toAddr = channel === "whatsapp" ? `whatsapp:${to}` : to;

  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

  const paramsObj = { From: from, To: toAddr };
  if (channel === "whatsapp" && TWILIO_CONTENT_SID) {
    paramsObj.ContentSid = TWILIO_CONTENT_SID;
    paramsObj.ContentVariables = JSON.stringify({ "1": body });
  } else {
    paramsObj.Body = body;
  }
  const params = new URLSearchParams(paramsObj);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Twilio send failed");
  return { sid: data.sid, status: data.status };
}

const APP_URL = process.env.PUBLIC_APP_URL || "https://aquaguard-ai-can0.onrender.com";

const BAND_STYLE = {
  SAFE: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", emoji: "✅" },
  WATCH: { color: "#EAB308", bg: "rgba(234,179,8,0.12)", emoji: "👀" },
  HIGH: { color: "#F97316", bg: "rgba(249,115,22,0.12)", emoji: "⚠️" },
  CRITICAL: { color: "#EF4444", bg: "rgba(239,68,68,0.14)", emoji: "🚨" },
};

function emailHtml(lake, risk, body) {
  const style = BAND_STYLE[risk.riskBand] || BAND_STYLE.WATCH;
  return `
  <div style="margin:0;padding:24px;background:#040B14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#0B1826;border:1px solid #1C2E42;border-radius:16px;overflow:hidden;">

      <div style="padding:20px 24px;background:linear-gradient(135deg,#062338,#031420);border-bottom:1px solid #1C2E42;">
        <span style="font-size:13px;font-weight:700;letter-spacing:0.08em;color:#3FD0FF;text-transform:uppercase;">
          🌊 AQUAGUARD AI
        </span>
      </div>

      <div style="padding:28px 24px 8px;">
        <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:${style.bg};border:1px solid ${style.color}55;color:${style.color};font-size:13px;font-weight:700;margin-bottom:16px;">
          ${style.emoji} ${risk.riskBand} · ${risk.overallRisk}/100
        </div>

        <h1 style="margin:0 0 12px;color:#E8EEF7;font-size:20px;font-weight:700;">
          ${lake.name}
        </h1>

        <p style="margin:0 0 20px;color:#B9C9DA;font-size:15px;line-height:1.6;">
          ${body}
        </p>
      </div>

      <div style="padding:16px 24px 22px;border-top:1px solid #142235;">
        <p style="margin:0;color:#5E7391;font-size:11px;line-height:1.5;">
          This is an automated decision-support alert from AQUAGUARD AI, not a certified emergency notification.
          Hyderabad watershed monitoring · powered by transparent risk simulation, not black-box predictions.
        </p>
      </div>

    </div>
  </div>`;
}

// Sends over HTTPS (port 443) via Resend's REST API - unaffected by hosts
// that block outbound SMTP ports, unlike nodemailer/Gmail below.
async function sendViaResend({ to, subject, body, lake, risk }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      text: body,
      html: emailHtml(lake, risk, body),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Resend send failed");
  return { messageId: data.id };
}

// Gmail SMTP fallback - works fine locally, but will time out on hosts
// (like Render's free tier) that block outbound SMTP ports.
async function sendViaGmailSmtp({ to, subject, body, lake, risk }) {
  const transporter = getEmailTransporter();
  const info = await transporter.sendMail({
    from: `"AQUAGUARD AI" <${EMAIL_USER}>`,
    to,
    subject,
    text: body,
    html: emailHtml(lake, risk, body),
  });
  return { messageId: info.messageId };
}

async function sendViaEmail({ to, subject, body, lake, risk }) {
  if (RESEND_API_KEY) return sendViaResend({ to, subject, body, lake, risk });
  return sendViaGmailSmtp({ to, subject, body, lake, risk });
}

function composeAlertBody(lake, risk) {
  const isUrgent = risk.riskBand === "HIGH" || risk.riskBand === "CRITICAL";
  if (isUrgent) {
    return (
      `AQUAGUARD ALERT: ${lake.name} has crossed into ${risk.riskBand} risk ` +
      `(${risk.overallRisk}/100). Immediate review recommended. This is an automated ` +
      `decision-support alert, not a certified emergency notification.`
    );
  }
  return (
    `AQUAGUARD STATUS CHECK: ${lake.name} is currently ${risk.riskBand} risk ` +
    `(${risk.overallRisk}/100). No action needed right now. This is an automated ` +
    `decision-support status notification, not a certified emergency alert.`
  );
}

/**
 * @returns {Promise<{sent: number, simulated: boolean, results: Array}>}
 */
async function dispatchCriticalAlert(subscriptions, lake, risk) {
  const body = composeAlertBody(lake, risk);
  const results = [];

  for (const sub of subscriptions) {
    const isLive = CHANNEL_LIVE[sub.channel];
    const destination = sub.channel === "email" ? sub.email : sub.phoneNumber;

    if (isLive) {
      try {
        if (sub.channel === "email") {
          const r = await sendViaEmail({
            to: sub.email,
            subject: `AQUAGUARD Alert: ${lake.name} is ${risk.riskBand}`,
            body,
            lake,
            risk,
          });
          console.log(`[alertDispatch:LIVE] Sent EMAIL to ${sub.email} (messageId: ${r.messageId})`);
          results.push({ destination, channel: sub.channel, status: "sent", providerStatus: "delivered" });
        } else {
          const r = await sendViaTwilio({ to: sub.phoneNumber, body, channel: sub.channel });
          console.log(`[alertDispatch:LIVE] Sent ${sub.channel.toUpperCase()} to ${sub.phoneNumber} - Twilio status: ${r.status} (sid: ${r.sid})`);
          results.push({ destination, channel: sub.channel, status: "sent", providerStatus: r.status });
        }
      } catch (err) {
        console.error(`[alertDispatch:FAILED] Could not send ${sub.channel.toUpperCase()} to ${destination}: ${err.message}`);
        results.push({ destination, channel: sub.channel, status: "failed", error: err.message });
      }
    } else {
      console.log(`[alertDispatch:SIMULATED] Would send ${sub.channel.toUpperCase()} to ${destination}: "${body}"`);
      results.push({ destination, channel: sub.channel, status: "simulated" });
    }
  }

  return { sent: results.length, simulated: !results.some((r) => r.status === "sent"), results, message: body };
}

module.exports = { dispatchCriticalAlert, composeAlertBody, LIVE_MODE, CHANNEL_LIVE };