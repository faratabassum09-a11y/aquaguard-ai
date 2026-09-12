import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 font-mono text-sm uppercase tracking-widest text-waterblue">Hyderabad Watershed Pilot</div>
      <h1 className="text-5xl font-bold text-white sm:text-6xl">AQUAGUARD AI</h1>
      <p className="mt-6 max-w-xl text-lg text-slate-300">
        Predict water crises. Understand their causes. Prevent them before they happen.
      </p>
      <p className="mt-2 max-w-xl text-sm text-mist">
        A predictive intelligence and decision-support platform for Hyderabad's lakes — Hussain Sagar,
        Durgam Cheruvu, Osman Sagar, Himayat Sagar, and Shamirpet.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-10 rounded-lg bg-waterblue px-8 py-3 font-medium text-abyss shadow-glow transition hover:opacity-90"
      >
        Enter Command Center
      </button>

      <div className="mt-16 grid grid-cols-2 gap-4 text-sm text-mist sm:grid-cols-6">
        {["Observe", "Predict", "Explain", "Simulate", "Optimize", "Prevent"].map((s) => (
          <div key={s} className="rounded-lg border border-panelBorder px-3 py-2">
            {s}
          </div>
        ))}
      </div>

      <div className="mt-8 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
        <FeaturePill emoji="🤖" title="Agentic AI Assistant" desc="Ask 'what if rainfall drops 30%?' — it actually runs the computation." />
        <FeaturePill emoji="⏳" title="Watershed Time Machine" desc="Scrub through 24 months of history and watch the whole map evolve." />
        <FeaturePill emoji="🕸️" title="Cascade Network" desc="Real Osman/Himayat Sagar → Musi chain → Hussain Sagar stress propagation." />
        <FeaturePill emoji="🎤" title="Voice Assistant" desc="Talk to AQUAGUARD instead of typing — hands-free field use." />
      </div>
    </div>
  );
}

function FeaturePill({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel/40 px-4 py-3">
      <div className="text-sm font-semibold text-white">
        {emoji} {title}
      </div>
      <div className="mt-1 text-xs text-mist">{desc}</div>
    </div>
  );
}
