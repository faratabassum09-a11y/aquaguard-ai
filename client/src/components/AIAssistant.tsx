import { useState } from "react";
import { askAssistant } from "../services/api";
import { ToolExecution } from "../types";
import VoiceInputButton from "./VoiceInputButton";

const SUGGESTED = [
  "Why is this lake at risk?",
  "What happens if rainfall drops 30%?",
  "Which intervention is cheapest?",
  "Generate a report for the municipal authority.",
];

type ChatMessage = { role: "user" | "ai"; text: string; toolExecution?: ToolExecution | null };

export default function AIAssistant({ lakeId }: { lakeId: string }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function send(q: string) {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const { answer, toolExecution } = await askAssistant(lakeId, q);
      setMessages((m) => [...m, { role: "ai", text: answer, toolExecution }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: "Something went wrong reaching the assistant." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-mist">
        <span className="h-2 w-2 animate-pulse rounded-full bg-waterblue" />
        AQUAGUARD agentic assistant — ask about this lake, or ask a live "what if"
      </div>

      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-panelBorder px-3 py-1 text-xs text-slate-300 hover:border-waterblue hover:text-waterblue"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 max-h-80 space-y-2 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx}>
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "ml-8 bg-waterblue/15 text-slate-100" : "mr-8 bg-abyss text-slate-300"
              }`}
            >
              {m.text}
            </div>
            {m.role === "ai" && m.toolExecution && (
              <div className="mr-8 mt-1 rounded-lg border border-waterblue/30 bg-waterblue/5 px-3 py-2 text-xs text-waterblue">
                <div className="mb-1 flex items-center gap-1.5 font-mono font-semibold">
                  🤖 Live computation executed — {toolLabel(m.toolExecution.type)}
                </div>
                {m.toolExecution.parseNotes && m.toolExecution.parseNotes.length > 0 && (
                  <div className="text-[11px] text-waterblue/70">
                    Parsed scenario: {m.toolExecution.parseNotes.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="mr-8 rounded-lg bg-abyss px-3 py-2 text-sm text-mist">Thinking &amp; computing…</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
        className="flex gap-2"
      >
        <VoiceInputButton
          onTranscript={(t) => setQuestion(t)}
          onFinalTranscript={(t) => {
            setQuestion(t);
            send(t);
          }}
        />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question, or tap 🎤 to speak…"
          className="flex-1 rounded-lg border border-panelBorder bg-abyss px-3 py-2 text-sm text-slate-100 outline-none focus:border-waterblue"
        />
        <button
          type="submit"
          className="rounded-lg bg-waterblue px-4 py-2 text-sm font-medium text-abyss hover:opacity-90"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function toolLabel(type: ToolExecution["type"]) {
  if (type === "simulate") return "ran a scenario simulation for this lake";
  if (type === "regional_simulate") return "ran a scenario across the whole watershed";
  if (type === "regional_optimize") return "ran the cross-lake budget optimizer";
  return "ran a live computation";
}
