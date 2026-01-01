"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

type UseSpeechRecognitionOptions = {
  lang?: string;
};

type UseSpeechRecognitionReturn = {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const lang = options.lang ?? "he-IL";

  const recognitionCtor = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  }, []);

  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isSupported = Boolean(recognitionCtor);

  const ensureRecognition = useCallback(() => {
    if (!recognitionCtor) return null;
    if (recognitionRef.current) return recognitionRef.current;

    const recognition = new recognitionCtor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      const msg = typeof event?.error === "string" ? event.error : "speech_error";
      setError(msg);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let fullText = "";
      for (let i = 0; i < event.results.length; i++) {
        fullText += String(event.results[i][0]?.transcript ?? "");
      }
      setTranscript(fullText.trim());
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [lang, recognitionCtor]);

  const start = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) return;

    try {
      setError(null);
      recognition.start();
    } catch {
      // Some browsers throw if start() is called twice; ignore.
    }
  }, [ensureRecognition]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  return { isSupported, isListening, transcript, error, start, stop, reset };
}
