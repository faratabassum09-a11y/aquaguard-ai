import { useState } from "react";
import { subscribeAlert, triggerAlert } from "../services/api";

type Channel = "email" | "whatsapp" | "sms";

export default function AlertSubscribeForm({ lakeId, lakeName }: { lakeId: string; lakeName: string }) {
  const [channel, setChannel] = useState<Channel>("email");
  const [phone, setPhone] = useState("+91");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [liveMode, setLiveMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const payload =
        channel === "email" ? { channel, email, lakeId } : { channel, phoneNumber: phone, lakeId };
      const data = await subscribeAlert(payload);
      setLiveMode(data.liveMode);
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Could not subscribe. Check the details you entered.");
      setStatus("error");
    }
  }

  async function sendTestNow() {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await triggerAlert(lakeId);
      setTestResult(data.dispatch);
    } catch (err: any) {
      setTestResult({ error: err?.response?.data?.error || "Trigger failed" });
    } finally {
      setTesting(false);
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-safe/30 bg-safe/5 p-4 text-sm">
        <div className="mb-1 font-semibold text-safe">✅ Subscribed for {lakeName} alerts</div>
        <div className="mb-3 text-xs text-slate-300">
          {liveMode
            ? `You'll receive a real ${channel.toUpperCase()} message the next time this lake crosses into CRITICAL risk — or click below to test it immediately.`
            : `That channel isn't configured with live credentials yet, so alerts will be logged as SIMULATED sends on the server console — the full subscribe → critical → dispatch flow still runs end to end.`}
        </div>

        <button
          onClick={sendTestNow}
          disabled={testing}
          className="w-full rounded-lg border border-safe/40 bg-safe/10 py-2 text-xs font-semibold text-safe hover:bg-safe/20 disabled:opacity-50"
        >
          {testing ? "Sending…" : "⚡ Send test alert now"}
        </button>

        {testResult && (
          <div className="mt-3 rounded-lg bg-abyss/60 p-3 text-xs">
            {testResult.error ? (
              <span className="text-critical">Error: {testResult.error}</span>
            ) : (
              testResult.results?.map((r: any, i: number) => (
                <div key={i} className={r.status === "failed" ? "text-critical" : "text-slate-300"}>
                  {r.channel.toUpperCase()} to {r.destination}: <strong>{r.status}</strong>
                  {r.error ? ` — ${r.error}` : ""}
                  {r.error && /content\s?sid/i.test(r.error) && (
                    <div className="mt-2 rounded-lg border border-high/30 bg-high/10 p-2 text-high">
                      💡 This means your WhatsApp sandbox session has closed. From your phone, resend your{" "}
                      <strong>join &lt;code&gt;</strong> message to the Twilio sandbox number, then click
                      "Send test alert now" again immediately after.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-mist">
        <span className="h-2 w-2 rounded-full bg-safe" />
        Get notified if {lakeName} turns CRITICAL
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setChannel("email")}
          className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
            channel === "email" ? "border-safe bg-safe/15 text-safe" : "border-panelBorder text-mist"
          }`}
        >
          📧 Email
        </button>
        {/* <button
          type="button"
          onClick={() => setChannel("whatsapp")}
          className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
            channel === "whatsapp" ? "border-safe bg-safe/15 text-safe" : "border-panelBorder text-mist"
          }`}
        >
          📱 WhatsApp
        </button> */}
        {/* <button
          type="button"
          onClick={() => setChannel("sms")}
          className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
            channel === "sms" ? "border-waterblue bg-waterblue/15 text-waterblue" : "border-panelBorder text-mist"
          }`}
        >
          💬 SMS
        </button> */}
      </div>

      {channel === "email" ? (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mb-2 w-full rounded-lg border border-panelBorder bg-abyss px-3 py-2 text-sm text-slate-100 outline-none focus:border-waterblue"
        />
      ) : (
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+919876543210"
          className="mb-2 w-full rounded-lg border border-panelBorder bg-abyss px-3 py-2 text-sm text-slate-100 outline-none focus:border-waterblue"
        />
      )}
      {channel !== "email" && (
        <p className="mb-3 text-[10px] text-mist">E.164 format with country code, e.g. +91 for India.</p>
      )}

      {channel === "email" && (
        <p className="mb-3 rounded-lg bg-abyss/60 p-2 text-[10px] text-mist">
          ℹ️ Recommended — email needs no phone verification, no message templates, and no telecom
          compliance registration. Works instantly with a free Gmail App Password.
        </p>
      )}
      {channel === "whatsapp" && (
        <p className="mb-3 rounded-lg bg-abyss/60 p-2 text-[10px] text-mist">
          ℹ️ Twilio's free WhatsApp sandbox only delivers messages within a 24-hour session that
          <em> you</em> start, and some accounts require an approved message template. Before testing,
          send your <strong>join &lt;code&gt;</strong> message to the sandbox number from WhatsApp first.
        </p>
      )}
      {channel === "sms" && (
        <p className="mb-3 rounded-lg bg-abyss/60 p-2 text-[10px] text-mist">
          ℹ️ Trial Twilio accounts can usually only send SMS to numbers verified in the console
          under Phone Numbers → Verified Caller IDs — this can also require a paid account for some
          regions (e.g. India's TRAI sender registration rules).
        </p>
      )}

      {status === "error" && <p className="mb-2 text-xs text-critical">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-safe py-2 text-sm font-semibold text-abyss hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? "Subscribing…" : "Subscribe for critical alerts"}
      </button>
    </form>
  );
}
