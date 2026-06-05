import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useIsMobile } from "./hooks/use-mobile";

// Config (edit here, nowhere else)
const BRAND_NAME = "Smart Lead Conversion";
const AUDIENCE_LINE = "Built for home remodeling contractors";
const CHANNELS = ["Website forms", "Facebook leads", "Email", "SMS"];
const SETUP_LINE = "Plugs into your current forms and lead sources. We handle the setup.";
const CTA_LABEL = "Book a call";
const CTA_HREF = "mailto:hello@smartleadconversion.com?subject=Book%20a%20call";
const PROOF_STAT = "78% of leads go with whoever replies first.";

export const improvementMeta = [
  { title: "Smart Lead Conversion | Same Lead, Two Outcomes" },
  {
    name: "description",
    content:
      "Side-by-side demo: see how instant AI lead response books remodeling jobs while slow replies go cold.",
  },
  { property: "og:title", content: "Smart Lead Conversion | Same Lead, Two Outcomes" },
  {
    property: "og:description",
    content: "Watch the same kitchen remodel lead play out two ways: booked in 2 minutes vs lost by afternoon.",
  },
];

type Side = "them" | "me";

type Step =
  | { kind: "card"; name: string; project: string; details: string; budget: string; submitted: string; delay: number }
  | { kind: "msg"; side: Side; text: string; time: string; delay: number; typingFor?: Side }
  | { kind: "note"; text: string; tone: "neutral" | "warn"; delay: number }
  | { kind: "gap"; text: string; delay: number }
  | { kind: "banner"; text: string; tone: "success" | "danger"; delay: number };

const withUsScript: Step[] = [
  {
    kind: "card",
    name: "Sarah Mitchell",
    project: "Kitchen remodel",
    details: "Full gut + island",
    budget: "$40k-$60k",
    submitted: "Submitted 10:14 AM via website form",
    delay: 400,
  },
  {
    kind: "msg",
    side: "me",
    text: "Hi Sarah! Thanks for reaching out. We'd love to help with your kitchen remodel. To get you an accurate quote, is this a full gut renovation or more of an update (cabinets, counters, etc.)?",
    time: "10:14 AM",
    delay: 1400,
    typingFor: "me",
  },
  {
    kind: "msg",
    side: "them",
    text: "Full gut, we want to move the island too",
    time: "10:15 AM",
    delay: 1600,
    typingFor: "them",
  },
  {
    kind: "msg",
    side: "me",
    text: "Perfect, that's our specialty. I have a slot Thursday at 10am or Friday at 2pm for a quick in-home estimate. Which works better?",
    time: "10:15 AM",
    delay: 1400,
    typingFor: "me",
  },
  { kind: "msg", side: "them", text: "Thursday works!", time: "10:16 AM", delay: 1600, typingFor: "them" },
  {
    kind: "msg",
    side: "me",
    text: "Locked in ✓ You'll get a confirmation text with the details shortly. See you Thursday!",
    time: "10:16 AM",
    delay: 1200,
    typingFor: "me",
  },
  {
    kind: "msg",
    side: "me",
    text: "📅 Confirmed: Thursday 10:00 AM in-home estimate with Mike Brennan, Project Lead. We'll text you the address and parking info shortly.",
    time: "10:16 AM",
    delay: 1400,
    typingFor: "me",
  },
  { kind: "banner", text: "Booked in under 2 minutes. Owner was on a job site.", tone: "success", delay: 800 },
];

const withoutUsScript: Step[] = [
  {
    kind: "card",
    name: "Sarah Mitchell",
    project: "Kitchen remodel",
    details: "Full gut + island",
    budget: "$40k-$60k",
    submitted: "Submitted 10:14 AM via website form",
    delay: 400,
  },
  { kind: "note", text: "Owner sees it between jobs…", tone: "neutral", delay: 1800 },
  { kind: "gap", text: "3 hours 33 minutes later", delay: 1000 },
  {
    kind: "msg",
    side: "me",
    text: "Hey, just got off the job site. Sorry for the late reply! Yes we do kitchen remodels. Can you tell me more about what you're looking for?",
    time: "1:47 PM",
    delay: 2200,
  },
  { kind: "note", text: "Homeowner booked an estimate with a competitor", tone: "warn", delay: 2000 },
  {
    kind: "msg",
    side: "me",
    text: "Just wanted to follow up in case you didn't see my message!",
    time: "2:30 PM",
    delay: 2200,
  },
  {
    kind: "msg",
    side: "them",
    text: "We went with another company, thanks though",
    time: "2:41 PM",
    delay: 1800,
    typingFor: "them",
  },
  { kind: "banner", text: "No booking. Lead went cold.", tone: "danger", delay: 1500 },
];

const demos = [
  {
    id: "without" as const,
    label: "Without us",
    sublabel: "Owner texts back between jobs",
    accent: "danger" as const,
    script: withoutUsScript,
  },
  {
    id: "with" as const,
    label: "With us",
    sublabel: "Instant reply on every channel",
    accent: "success" as const,
    script: withUsScript,
  },
];

export function ImprovementDemo() {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"without" | "with">("without");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const anyPlaying = playingIds.size > 0;

  const setDemoPlaying = (id: string, playing: boolean) => {
    setPlayingIds((prev) => {
      const next = new Set(prev);
      if (playing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const playBoth = () => {
    setHasInteracted(true);
    setPlayToken((t) => t + 1);
  };

  const resetBoth = () => {
    setResetToken((t) => t + 1);
    setPlayingIds(new Set());
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto max-w-6xl px-6 pt-10 pb-8 text-center md:pt-14">
        <p className="text-sm font-semibold tracking-tight text-foreground">{BRAND_NAME}</p>
        <p className="mt-2 text-sm text-muted-foreground">{AUDIENCE_LINE}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Same lead. Two outcomes.</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          10:14 AM kitchen remodel inquiry, booked by 10:16, or lost by afternoon.
        </p>

        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CHANNELS.map((channel) => (
              <span
                key={channel}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
              >
                {channel}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={playBoth}
            disabled={anyPlaying}
            className={`inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 ${
              !hasInteracted ? "animate-pulse ring-4 ring-primary/20" : ""
            }`}
          >
            <PlayIcon />
            {anyPlaying ? "Playing both…" : hasInteracted ? "Play both again" : "Play both"}
          </button>
          {!hasInteracted && (
            <p className="text-sm text-muted-foreground">
              {isMobile
                ? "Tap Play both, then switch tabs to compare each side."
                : "Start here. Both phones run at the same time so you can compare."}
            </p>
          )}
          {hasInteracted && (
            <button onClick={resetBoth} className="text-sm text-muted-foreground hover:text-foreground">
              Reset both
            </button>
          )}
        </div>
      </header>

      {isMobile && (
        <div className="mx-auto flex max-w-sm justify-center gap-2 px-6 pb-6">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setMobileTab(demo.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mobileTab === demo.id
                  ? demo.accent === "success"
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {demo.label}
            </button>
          ))}
        </div>
      )}

      <main
        className={`mx-auto max-w-6xl px-6 pb-16 ${isMobile ? "flex flex-col items-center" : "grid grid-cols-1 gap-10 md:grid-cols-2"}`}
        aria-live="polite"
      >
        {demos.map((demo) => (
          <div
            key={demo.id}
            className={isMobile && mobileTab !== demo.id ? "hidden" : isMobile ? "w-full" : undefined}
          >
            <ChatDemo
              label={demo.label}
              sublabel={demo.sublabel}
              accent={demo.accent}
              contactName="Sarah Mitchell"
              script={demo.script}
              playToken={playToken}
              resetToken={resetToken}
              showGuide={!hasInteracted && !isMobile && demo.id === "without"}
              onPlayingChange={(playing) => setDemoPlaying(demo.id, playing)}
              onInteract={() => setHasInteracted(true)}
            />
          </div>
        ))}
      </main>

      <footer id="book-call" className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <p className="text-lg font-medium md:text-xl">Every hour you wait costs you jobs. We fix that.</p>
        <p className="mt-2 text-sm text-muted-foreground">{PROOF_STAT}</p>
        <p className="mt-2 text-sm text-muted-foreground">{SETUP_LINE}</p>
        <a
          href={CTA_HREF}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] hover:bg-primary/90"
        >
          {CTA_LABEL}
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
  playToken,
  resetToken,
  showGuide,
  onPlayingChange,
  onInteract,
}: {
  label: string;
  sublabel: string;
  accent: "success" | "danger";
  contactName: string;
  script: Step[];
  playToken: number;
  resetToken: number;
  showGuide?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onInteract?: () => void;
}) {
  const [visible, setVisible] = useState<Step[]>([]);
  const [typing, setTyping] = useState<Side | null>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onInteractRef = useRef(onInteract);
  const outcomeTone = script.find((s): s is Extract<Step, { kind: "banner" }> => s.kind === "banner")?.tone;

  onPlayingChangeRef.current = onPlayingChange;
  onInteractRef.current = onInteract;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const play = useCallback(() => {
    clearTimers();
    setVisible([]);
    setTyping(null);
    setDone(false);
    setOutcome(null);
    setPlaying(true);
    onPlayingChangeRef.current?.(true);
    onInteractRef.current?.();

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
          if (step.kind === "banner") setOutcome(step.text);
          if (i === script.length - 1) {
            setPlaying(false);
            setDone(true);
            onPlayingChangeRef.current?.(false);
          }
        }, elapsed),
      );
    });
  }, [clearTimers, script]);

  const reset = useCallback(() => {
    clearTimers();
    setVisible([]);
    setTyping(null);
    setPlaying(false);
    setDone(false);
    setOutcome(null);
    onPlayingChangeRef.current?.(false);
  }, [clearTimers]);

  const playRef = useRef(play);
  const resetRef = useRef(reset);
  playRef.current = play;
  resetRef.current = reset;

  useEffect(() => {
    if (playToken > 0) playRef.current();
  }, [playToken]);

  useEffect(() => {
    if (resetToken > 0) resetRef.current();
  }, [resetToken]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-5 text-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
            accent === "success"
              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${accent === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          {label}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">{sublabel}</p>
      </div>

      <PhoneFrame contactName={contactName}>
        <div ref={scrollRef} className="flex h-full flex-col gap-2 overflow-y-auto px-4 py-4">
          {visible.length === 0 && !typing && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-xs text-neutral-400">Press play to start the conversation</p>
              {showGuide && (
                <p className="text-[11px] font-medium text-neutral-500">Or use Play both above</p>
              )}
            </div>
          )}
          {visible.map((step, i) => (
            <StepView key={i} step={step} hideBanner />
          ))}
          {typing && <TypingBubble side={typing} />}
        </div>
      </PhoneFrame>

      {outcome && (
        <OutcomeBadge text={outcome} tone={outcomeTone === "success" ? "success" : "danger"} />
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={play}
          disabled={playing}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <PlayIcon />
          {done ? "Replay" : playing ? "Playing…" : "Play"}
        </button>
        {(playing || done) && (
          <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function OutcomeBadge({ text, tone }: { text: string; tone: "success" | "danger" }) {
  return (
    <div
      className={`mt-4 w-full max-w-[340px] rounded-xl px-4 py-3 text-center text-sm font-semibold ${
        tone === "success"
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
      }`}
    >
      {tone === "success" ? "✓ " : "✕ "}
      {text}
    </div>
  );
}

function StepView({ step, hideBanner }: { step: Step; hideBanner?: boolean }) {
  if (step.kind === "msg") return <Bubble side={step.side} text={step.text} time={step.time} />;
  if (step.kind === "card") return <CardView step={step} />;
  if (step.kind === "gap") return <GapView text={step.text} />;
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
  if (hideBanner) return null;
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

function GapView({ text }: { text: string }) {
  return (
    <div className="my-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-neutral-200" />
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-rose-600">{text}</span>
      <div className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}

function CardView({ step }: { step: Extract<Step, { kind: "card" }> }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0A84FF]/10 text-sm">
            📋
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-neutral-900">New estimate request</p>
            <p className="mt-0.5 text-[11px] text-neutral-600">
              {step.name} · {step.project}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">{step.details}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                {step.budget}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-neutral-400">{step.submitted}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, text, time }: { side: Side; text: string; time: string }) {
  const mine = side === "me";
  return (
    <div
      className={`flex flex-col ${mine ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
          mine ? "rounded-br-md bg-[#0A84FF] text-white" : "rounded-bl-md bg-[#E9E9EB] text-neutral-900"
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

function PhoneFrame({ contactName, children }: { contactName: string; children: ReactNode }) {
  return (
    <div className="relative w-full max-w-[340px]">
      <div className="rounded-[2.75rem] bg-neutral-900 p-2.5 shadow-2xl shadow-neutral-900/20">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-5 pb-2 pt-3 text-[11px] font-medium text-neutral-700 backdrop-blur">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg viewBox="0 0 16 12" className="h-2.5 w-3.5 fill-neutral-800" aria-hidden>
      <rect x="0" y="8" width="2.5" height="4" rx="0.5" />
      <rect x="4" y="5.5" width="2.5" height="6.5" rx="0.5" />
      <rect x="8" y="3" width="2.5" height="9" rx="0.5" />
      <rect x="12" y="0" width="2.5" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 16 12" className="h-2.5 w-3.5 fill-neutral-800" aria-hidden>
      <path d="M8 10.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM4.2 7.1a5.5 5.5 0 0 1 7.6 0l-.9 1.1a4.1 4.1 0 0 0-5.8 0L4.2 7.1ZM1.1 4.2a9.5 9.5 0 0 1 13.8 0l-.9 1.1a8.1 8.1 0 0 0-12 0L1.1 4.2Z" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 22 12" className="h-2.5 w-5 fill-neutral-800" aria-hidden>
      <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" fill="none" stroke="currentColor" />
      <rect x="2" y="2" width="13" height="8" rx="1.5" />
      <rect x="19.5" y="4" width="2" height="4" rx="1" />
    </svg>
  );
}
