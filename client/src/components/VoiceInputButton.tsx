import { useEffect, useRef, useState } from "react";

// Minimal ambient typing for the (still non-standard) Web Speech API so this
// compiles under TypeScript without pulling in extra @types packages.
type SpeechRecognitionResultLike = { transcript: string };
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export default function VoiceInputButton({
  onTranscript,
  onFinalTranscript,
}: {
  onTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function toggle() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result: SpeechRecognitionResultLike = event.results[i][0];
        if (event.results[i].isFinal) final += result.transcript;
        else interim += result.transcript;
      }
      if (interim) onTranscript?.(interim);
      if (final) {
        onFinalTranscript?.(final.trim());
        onTranscript?.(final.trim());
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop listening" : "Ask by voice"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm transition ${
        listening
          ? "border-critical bg-critical/20 text-critical animate-pulse"
          : "border-panelBorder text-mist hover:border-waterblue hover:text-waterblue"
      }`}
    >
      {listening ? "⏺" : "🎤"}
    </button>
  );
}
