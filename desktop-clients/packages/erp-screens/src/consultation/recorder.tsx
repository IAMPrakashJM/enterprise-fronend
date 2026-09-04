"use client";

import React, { useEffect, useRef, useState } from "react";
import { Circle, Mic, MicOff, Pause, Play, Square } from "lucide-react";
import { Badge, Button, cn } from "@pepbits/ops-ui";
import { readToken } from "@pepbits/auth";

/**
 * Ambient consultation recording.
 *
 * The browser holds the microphone and nothing else: chunks go straight out over
 * the socket, no audio is buffered for replay, nothing is written to storage,
 * and the transcript lives in React state that dies with the page. Everything
 * that could persist belongs to the gateway, which is where it can be governed.
 *
 * The socket is bidirectional. Audio goes up as binary frames; TRANSCRIPT_PARTIAL
 * and TRANSCRIPT_FINAL come back as JSON. A partial is REPLACED by the final with
 * the same sequence rather than appended — an interim guess left in the record is
 * how a transcript ends up saying something nobody said.
 */

type Segment = { sequence: number; speaker: string; text: string; final: boolean; startTime?: number };

const WS_URL = () => {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_API_URL || "/api";
  if (/^https?:/i.test(base)) return base.replace(/^http/i, "ws").replace(/\/$/, "") + "/speech";
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${base.replace(/\/$/, "")}/speech`;
};

export function ConsultationRecorder({ onTranscript }: { onTranscript?: (text: string) => void }) {
  const [state, setState] = useState<"idle" | "starting" | "recording" | "paused" | "ended">("idle");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [provider, setProvider] = useState<{ label: string; model: string | null; verified: boolean } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const socket = useRef<WebSocket | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  /* Refs, not state: the recorder's onstop closure captures whatever these hold
     at the moment it fires, and a state value would be the one from the render
     that created it. */
  const stopped = useRef(false);
  const paused = useRef(false);

  const teardown = () => {
    recorder.current?.state !== "inactive" && recorder.current?.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    if (timer.current) window.clearInterval(timer.current);
    socket.current?.close();
    recorder.current = null; stream.current = null; socket.current = null; timer.current = null;
  };
  /* The microphone must not outlive the page. Without this, navigating away
     mid-consultation leaves the recording indicator on and the stream open. */
  useEffect(() => teardown, []);

  const start = async () => {
    setProblem(null); setState("starting"); setSegments([]); setSeconds(0);
    stopped.current = false; paused.current = false;
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setProblem("Microphone permission was refused, or no input device is available.");
      setState("idle"); return;
    }
    stream.current = media;

    /* From the auth package, not a literal. The key is "nexora-session-token"
       and my first guess at it was wrong — a hardcoded copy in another package
       is one rename away from a failure that presents as "not signed in" with
       nothing obviously broken. */
    const token = readToken();
    const ws = new WebSocket(WS_URL());
    socket.current = ws;

    /* The container the browser chose. Chrome gives webm/opus, Safari mp4/aac,
       and the gateway has to label the upload correctly or the provider rejects
       it as corrupt — which reads as a broken microphone and is not. */
    const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported?.(m)) ?? "";
    ws.onopen = () => ws.send(JSON.stringify({ type: "SESSION_START", token, language, mime }));
    ws.onerror = () => {
      /* Named precisely, because the likeliest cause is infrastructure rather
         than the app: a proxy that does not pass the upgrade header. */
      setProblem("The speech gateway could not be reached. A reverse proxy in front of the API must be configured to pass WebSocket upgrades.");
      setState("idle"); teardown();
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(String(event.data));
      if (message.type === "SESSION_READY") {
        setProvider({ label: message.provider.label, model: message.provider.model, verified: message.verified });
        setState("recording");
        /* TAKES, NOT TIMESLICES. rec.start(1000) yields chunks of which only
           the first carries a container header; the rest are undecodable on
           their own, so a batch transcription endpoint rejects them. Recording
           a complete take, stopping, sending, and starting the next makes every
           binary message a standalone audio file — and costs one transcription
           per take rather than re-sending a growing buffer, which would be
           quadratic over a long consultation. */
        const TAKE_MS = 10000;
        const recordTake = () => {
          if (!stream.current || ws.readyState !== WebSocket.OPEN) return;
          const rec = mime ? new MediaRecorder(media, { mimeType: mime }) : new MediaRecorder(media);
          recorder.current = rec;
          rec.ondataavailable = async (e) => {
            if (e.data.size > 1024 && ws.readyState === WebSocket.OPEN) ws.send(await e.data.arrayBuffer());
          };
          rec.onstop = () => { if (!stopped.current && !paused.current) recordTake(); };
          rec.start();
          window.setTimeout(() => { if (rec.state === "recording") rec.stop(); }, TAKE_MS);
        };
        recordTake();
        timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      }
      if (message.type === "TRANSCRIPT_PARTIAL" || message.type === "TRANSCRIPT_FINAL") {
        const final = message.type === "TRANSCRIPT_FINAL";
        setSegments((prev) => {
          const next = prev.filter((s) => s.sequence !== message.sequence);
          return [...next, { sequence: message.sequence, speaker: message.speaker, text: message.text, final, startTime: message.startTime }]
            .sort((a, b) => a.sequence - b.sequence);
        });
      }
      if (message.type === "TRANSCRIPT_DROPPED") {
        setSegments((prev) => prev.filter((s) => s.sequence !== message.sequence));
      }
      if (message.type === "ERROR") { setProblem(`${message.error}${message.detail ? ` ${message.detail}` : ""}`); setState("idle"); teardown(); }
      if (message.type === "SESSION_ENDED") setState("ended");
    };
  };

  const pause = () => {
    if (state === "recording") {
      paused.current = true; recorder.current?.pause();
      socket.current?.send(JSON.stringify({ type: "PAUSE" })); setState("paused");
    } else {
      paused.current = false; recorder.current?.resume();
      socket.current?.send(JSON.stringify({ type: "RESUME" })); setState("recording");
    }
  };
  const stop = () => {
    stopped.current = true;
    socket.current?.send(JSON.stringify({ type: "STOP" }));
    setState("ended");
    recorder.current?.state !== "inactive" && recorder.current?.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    if (timer.current) window.clearInterval(timer.current);
  };

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const finals = segments.filter((s) => s.final);

  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {state === "idle" || state === "ended" ? (
          <Button size="sm" variant="primary" leftIcon={<Mic className="size-3.5" />} onClick={() => void start()}>
            {state === "ended" ? "Record again" : "Start recording"}
          </Button>
        ) : (
          <>
            <Button size="sm" variant="secondary" leftIcon={state === "paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />} onClick={pause}>
              {state === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button size="sm" variant="danger" leftIcon={<Square className="size-3.5" />} onClick={stop}>Stop</Button>
          </>
        )}

        <span className="font-mono text-[length:calc(13px*var(--fs-scale))] font-black tabular-nums">{clock}</span>
        {state === "recording" ? (
          <span className="flex items-center gap-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-bold text-[var(--danger)]">
            <Circle className="size-2 animate-pulse fill-current" /> Recording
          </span>
        ) : state === "paused" ? <Badge tone="warning">paused</Badge>
          : state === "starting" ? <Badge tone="neutral">connecting…</Badge> : null}

        <span className="flex-1" />
        {state === "idle" ? (
          <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
            {(["en", "ar"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setLanguage(l)}
                className={cn("focus-ring px-2.5 py-1 text-[length:calc(9.5px*var(--fs-scale))] font-bold uppercase transition",
                  language === l ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-muted)]")}>
                {l}
              </button>
            ))}
          </div>
        ) : null}
        {provider ? (
          <Badge tone={provider.verified ? "neutral" : "warning"}>
            {provider.label}{provider.model ? ` · ${provider.model}` : ""}{provider.verified ? "" : " · unverified"}
          </Badge>
        ) : null}
      </div>

      {problem ? (
        <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_7%,transparent)] p-2.5 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
          <MicOff className="mt-0.5 size-3.5 shrink-0 text-[var(--danger)]" />
          <span>{problem}</span>
        </div>
      ) : null}

      {provider && !provider.verified ? (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-2.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed">
          This adapter has never run against its provider in this build. Treat anything below as illustrative, not as a transcript.
        </div>
      ) : null}

      <div className="nex-scrollbar max-h-72 min-h-24 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
        {segments.length === 0 ? (
          <div className="py-6 text-center text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">
            {state === "recording" ? "Listening…" : "The transcript appears here as it is spoken."}
          </div>
        ) : segments.map((s) => (
          <div key={s.sequence} className={cn("mb-1.5 grid grid-cols-[70px_1fr] gap-2 text-[length:calc(10px*var(--fs-scale))] leading-relaxed", !s.final && "opacity-60")}>
            <span className={cn("text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.06em]",
              s.speaker === "DOCTOR" ? "text-[var(--primary)]" : "text-[var(--success)]")}>{s.speaker}</span>
            <span>{s.text}{!s.final ? <span className="ms-1 text-[var(--text-subtle)]">(interim)</span> : null}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">
          {finals.length} final segment{finals.length === 1 ? "" : "s"} · audio is streamed, never stored · the transcript is not saved until you use it
        </span>
        <span className="flex-1" />
        <Button size="sm" variant="secondary" disabled={!finals.length}
          onClick={() => onTranscript?.(finals.map((s) => `${s.speaker}: ${s.text}`).join("\n"))}>
          Insert into narrative
        </Button>
      </div>
    </div>
  );
}
