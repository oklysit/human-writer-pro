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
  /**
   * Clear the accumulated `finalTranscript` and `interimTranscript` without
   * stopping recognition. Used by the interview panel after a turn submission
   * to draw a clean boundary between turns when the mic is left running.
   * Without this, an active recording session would keep accumulating and
   * the next turn's stored answer would include all previous turns' text
   * (Scenario B state corruption — see 2026-04-15 consultant report).
   */
  reset: () => void;
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
  // Hoisted to a ref so reset() can clear it without restarting recognition.
  // Previously this was a closure variable inside start(), which meant only
  // a fresh start() call could reset it — corrupting state when the mic was
  // left running across turn submits (2026-04-15 fix).
  const accumulatedFinalRef = React.useRef("");
  // True while the caller wants recognition to stay alive. Flipped false in
  // stop() and on terminal errors (permission/device). Chrome auto-ends the
  // Web Speech session after ~15-20s of silence even with continuous=true;
  // without re-arming it here the mic drops mid-interview and the user has
  // to tap it again. Auto-restart fires in onend when this is still true.
  const shouldRestartRef = React.useRef(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
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

    accumulatedFinalRef.current = "";

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedFinalRef.current += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setFinalTranscript(accumulatedFinalRef.current);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // "no-speech" is expected during normal pauses — onend will auto-restart
      // silently. Don't surface it as an error; the mic button will stay lit.
      if (event.error === "no-speech") {
        return;
      }

      // Any other error is terminal for this session — prevent onend from
      // restarting into a failure loop.
      shouldRestartRef.current = false;

      let message: string;
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          message = "Microphone access denied. Check your browser permissions.";
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
      // Chrome auto-ends the Web Speech session after ~15-20s of silence even
      // with continuous=true. If the caller still wants the mic live, restart
      // the same instance rather than bubbling the end up to the UI.
      if (shouldRestartRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to cleanup if restart fails (e.g. instance is dead).
        }
      }
      setRecording(false);
      setInterimTranscript("");
      startingRef.current = false;
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    startingRef.current = true;
    shouldRestartRef.current = true;
    setError(null);
    setFinalTranscript("");
    setInterimTranscript("");

    recognition.start();
    setRecording(true);
    startingRef.current = false;
  }, [supported, recording, onError]);

  const stop = React.useCallback(() => {
    if (!recording || !recognitionRef.current) return;
    // Disable auto-restart BEFORE stopping the recognition instance. Otherwise
    // onend would re-arm the mic against the user's intent.
    shouldRestartRef.current = false;
    // Null handlers FIRST so any chunks already in the recognition pipeline
    // (typically the last few words still being processed when the user hit
    // submit) cannot fire onresult and re-populate the textarea after the
    // caller cleared it. Without this, voice-recognition lag would leak the
    // tail of the previous answer into the next turn's input. (2026-04-15
    // bug: user observed "final 3 lines or so" of prior response remaining
    // in the textbox after submit.)
    recognitionRef.current.onresult = null;
    recognitionRef.current.onerror = null;
    recognitionRef.current.onend = null;
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setRecording(false);
    setInterimTranscript("");
    startingRef.current = false;
  }, [recording]);

  const reset = React.useCallback(() => {
    accumulatedFinalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    supported,
    recording,
    interimTranscript,
    finalTranscript,
    start,
    stop,
    reset,
    error,
  };
}
