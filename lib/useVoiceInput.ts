"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// Minimal ambient typings for Web Speech API (not in standard TS DOM lib)
// ---------------------------------------------------------------------------
interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { transcript: string };
  readonly length: number;
}

interface ISpeechRecognitionEvent {
  readonly results: {
    readonly [index: number]: ISpeechRecognitionResult;
    readonly length: number;
  };
  readonly resultIndex: number;
}

interface ISpeechRecognitionErrorEvent {
  readonly error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

// ---------------------------------------------------------------------------
// Exported hook surface — no `any`
// ---------------------------------------------------------------------------
export type UseVoiceInputOptions = {
  /** Called with a friendly error message when recognition fails. */
  onError?: (message: string) => void;
};

export type UseVoiceInputReturn = {
  /** Whether the browser supports the Web Speech API. */
  supported: boolean;
  /** Whether recognition is currently active. */
  recording: boolean;
  /** Non-final transcript fragment being spoken right now. */
  interimTranscript: string;
  /** Accumulated final transcript from this recognition session. */
  finalTranscript: string;
  /** Start recognition. No-op if already recording or not supported. */
  start: () => void;
  /** Stop recognition. No-op if not recording. */
  stop: () => void;
  /** Last error message, null if none. */
  error: string | null;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useVoiceInput(opts: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onError } = opts;

  // SSR-safe support check — never access `window` at module level
  const supported = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w["SpeechRecognition"] || w["webkitSpeechRecognition"]);
  }, []);

  const [recording, setRecording] = React.useState(false);
  const [interimTranscript, setInterimTranscript] = React.useState("");
  const [finalTranscript, setFinalTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Stable ref to the active recognition instance
  const recognitionRef = React.useRef<ISpeechRecognition | null>(null);
  // Guard against double-start from rapid clicks
  const startingRef = React.useRef(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        // Null out handlers first to prevent state updates after unmount
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = React.useCallback(() => {
    if (!supported || recording || startingRef.current) return;

    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as SpeechRecognitionConstructor;
    const recognition = new Ctor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let accumulatedFinal = "";

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedFinal += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setFinalTranscript(accumulatedFinal);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      let message: string;
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          message = "Microphone access denied. Check your browser permissions.";
          break;
        case "no-speech":
          message = "No speech detected. Try again.";
          break;
        case "network":
          message = "Network error during voice recognition. Check your connection.";
          break;
        case "audio-capture":
          message = "No microphone found. Connect a microphone and try again.";
          break;
        default:
          message = `Voice recognition error: ${event.error}`;
      }
      setError(message);
      onError?.(message);
      setRecording(false);
      startingRef.current = false;
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setRecording(false);
      setInterimTranscript("");
      startingRef.current = false;
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    startingRef.current = true;
    setError(null);
    setFinalTranscript("");
    setInterimTranscript("");

    recognition.start();
    setRecording(true);
    startingRef.current = false;
  }, [supported, recording, onError]);

  const stop = React.useCallback(() => {
    if (!recording || !recognitionRef.current) return;
    recognitionRef.current.stop();
    // State is updated via onend handler
  }, [recording]);

  return {
    supported,
    recording,
    interimTranscript,
    finalTranscript,
    start,
    stop,
    error,
  };
}
