import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Instant Lead Response Demo — See the Difference" },
      { name: "description", content: "See how instant AI lead response books remodeling jobs while slow replies go cold." },
      { property: "og:title", content: "Instant Lead Response Demo" },
      { property: "og:description", content: "Side-by-side demo: slow vs instant lead response for home remodeling." },
    ],
  }),
  component: Index,
});

type Side = "them" | "me";

type Step =
  | { kind: "msg"; side: Side; text: string; time: string; delay: number; typingFor?: Side }
  | { kind: "note"; text: string; tone: "neutral" | "warn"; delay: number }
  | { kind: "banner"; text: string; tone: "success" | "danger"; delay: number };

const withUsScript: Step[] = [
  { kind: "msg", side: "them", text: "Hi, I'm looking to remodel my kitchen, can I get a quote this week?", time: "10:14 AM", delay: 600 },
  { kind: "msg", side: "me", text: "Hi Sarah! Thanks for reaching out. We'd love to help with your kitchen remodel. To get you an accurate quote — is this a full gut renovation or more of an update (cabinets, counters, etc.)?", time: "10:14 AM", delay: 1400, typingFor: "me" },
  { kind: "msg", side: "them", text: "Full gut, we want to move the island too", time: "10:15 AM", delay: 1600, typingFor: "them" },
  { kind: "msg", side: "me", text: "Perfect, that's our specialty. I have a slot Thursday at 10am or Friday at 2pm for a quick 20-min call with our project lead — which works better?", time: "10:15 AM", delay: 1400, typingFor: "me" },
  { kind: "msg", side: "them", text: "Thursday works!", time: "10:16 AM", delay: 1600, typingFor: "them" },
  { kind: "msg", side: "me", text: "Locked in ✓ You'll get a confirmation text shortly. See you Thursday!", time: "10:16 AM", delay: 1200, typingFor: "me" },
  { kind: "banner", text: "Booked in under 2 minutes. Owner was on a job site.", tone: "success", delay: 800 },
];

const withoutUsScript: Step[] = [
  { kind: "msg", side: "them", text: "Hi, I'm looking to remodel my kitchen, can I get a quote this week?", time: "10:14 AM", delay: 600 },
  { kind: "note", text: "Owner sees it between jobs…", tone: "neutral", delay: 1800 },
  { kind: "msg", side: "me", text: "Hey sorry for the late reply, yes we do kitchen remodels! Can you tell me more about what you're looking for?", time: "1:47 PM", delay: 2200 },
  { kind: "note", text: "Homeowner is now on a call with a competitor", tone: "warn", delay: 2000 },
  { kind: "msg", side: "me", text: "Just wanted to follow up in case you didn't see my message!", time: "2:30 PM", delay: 2200 },
  { kind: "banner", text: "No booking. Lead went cold.", tone: "danger", delay: 1500 },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Live Demo</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          Slow reply vs instant reply
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Press play on both phones. Watch the same lead play out two very different ways.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-16 md:grid-cols-2">
        <ChatDemo
          label="Without us"
          sublabel="Owner replies when they can"
          accent="danger"
          contactName="Sarah Mitchell"
          script={withoutUsScript}
        />
        <ChatDemo
          label="With us"
          sublabel="AI assistant replies instantly"
          accent="success"
          contactName="Sarah Mitchell"
          script={withUsScript}
        />
      </main>

      <footer className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <p className="text-lg font-medium md:text-xl">
          Every hour you wait costs you jobs. We fix that.
        </p>
        <a
          href="#"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] hover:bg-primary/90"
        >
          See how it works
        </a>
      </footer>
    </div>
  );
}

function ChatDemo({
  label,
  sublabel,
  accent,
  contactName,
  script,
}: {
  label: string;
  sublabel: string;
  accent: "success" | "danger";
  contactName: string;
  script: Step[];
}) {
  const [visible, setVisible] = useState<Step[]>([]);
  const [typing, setTyping] = useState<Side | null>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const play = () => {
    clearTimers();
    setVisible([]);
    setTyping(null);
    setDone(false);
    setPlaying(true);
    let elapsed = 0;
    script.forEach((step, i) => {
      if (step.kind === "msg" && step.typingFor) {
        const typingStart = elapsed + 200;
        timers.current.push(setTimeout(() => setTyping(step.typingFor!), typingStart));
      }
      elapsed += step.delay;
      timers.current.push(
        setTimeout(() => {
          setTyping(null);
          setVisible((v) => [...v, step]);
          if (i === script.length - 1) {
            setPlaying(false);
            setDone(true);
          }
        }, elapsed),
      );
    });
  };

  const reset = () => {
    clearTimers();
    setVisible([]);
    setTyping(null);
    setPlaying(false);
    setDone(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-5 text-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            accent === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${accent === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          {label}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">{sublabel}</p>
      </div>

      <PhoneFrame contactName={contactName}>
        <div ref={scrollRef} className="flex h-full flex-col gap-2 overflow-y-auto px-4 py-4">
          {visible.length === 0 && !typing && (
            <div className="flex h-full items-center justify-center text-center text-xs text-neutral-400">
              Press play to start the conversation
            </div>
          )}
          {visible.map((step, i) => (
            <StepView key={i} step={step} />
          ))}
          {typing && <TypingBubble side={typing} />}
        </div>
      </PhoneFrame>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={play}
          disabled={playing}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          {done ? "Replay" : playing ? "Playing…" : "Play"}
        </button>
        {(playing || done) && (
          <button
            onClick={reset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function StepView({ step }: { step: Step }) {
  if (step.kind === "msg") return <Bubble side={step.side} text={step.text} time={step.time} />;
  if (step.kind === "note")
    return (
      <div className="my-2 text-center">
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-medium ${
            step.tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {step.text}
        </span>
      </div>
    );
  return (
    <div
      className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${
        step.tone === "success"
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
      }`}
    >
      {step.tone === "success" ? "✓ " : "✕ "}
      {step.text}
    </div>
  );
}

function Bubble({ side, text, time }: { side: Side; text: string; time: string }) {
  const mine = side === "me";
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
          mine
            ? "rounded-br-md bg-[#0A84FF] text-white"
            : "rounded-bl-md bg-[#E9E9EB] text-neutral-900"
        }`}
      >
        {text}
      </div>
      <span className="mt-1 px-1 text-[10px] text-neutral-400">{time}</span>
    </div>
  );
}

function TypingBubble({ side }: { side: Side }) {
  const mine = side === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-center gap-1 rounded-2xl px-3.5 py-2.5 ${
          mine ? "rounded-br-md bg-[#0A84FF]" : "rounded-bl-md bg-[#E9E9EB]"
        }`}
      >
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className={`h-1.5 w-1.5 animate-bounce rounded-full ${mine ? "bg-white/80" : "bg-neutral-500"}`}
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function PhoneFrame({ contactName, children }: { contactName: string; children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[340px]">
      <div className="rounded-[2.75rem] bg-neutral-900 p-2.5 shadow-2xl shadow-neutral-900/20">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-5 pb-2 pt-3 text-[11px] font-medium text-neutral-700 backdrop-blur">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-neutral-800" />
              <span className="h-2 w-3 rounded-sm bg-neutral-800" />
            </span>
          </div>
          <div className="flex flex-col items-center border-b border-neutral-100 bg-neutral-50/80 px-4 pb-3 pt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600">
              {contactName
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </div>
            <p className="mt-1 text-[12px] font-medium text-neutral-800">{contactName}</p>
          </div>
          <div className="h-[480px] bg-white">{children}</div>
        </div>
      </div>
    </div>
  );
}
