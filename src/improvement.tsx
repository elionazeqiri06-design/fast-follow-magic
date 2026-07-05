import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useIsMobile } from "./hooks/use-mobile";

// Config (edit here, nowhere else)
// Demo layout toggle — set to false to restore the original experience
// (per-phone Play buttons, extra hints, label badges on mobile)
const SIMPLE_DEMO = true;
// Mini phone mode — renders full-quality phones scaled down to fit the layout
const MINI_PHONE = true;
const PHONE_WIDTH = 340;
const PHONE_SCALE = 0.86;
const PHONE_SCALE_MIN = 0.58;
const MOBILE_LABEL_SHARE = 0.4;
const PHONE_CHAT_HEIGHT = 460;
// Auto-start both demos when the comparison scrolls into view (once per visit)
const AUTO_PLAY_ON_VIEW = true;
// Conversation pacing — lower = faster (0.5 ≈ half the original timing)
const DEMO_SPEED = 0.5;
// Padding from viewport top when scrolling to each demo
const SCROLL_TO_SLOW_TOP_PADDING = 32;
const SCROLL_TO_INSTANT_TOP_PADDING = 20;
const SCROLL_DURATION_MS = 1400;
const TRANSITION_PAUSE_MS = 900;
const CUE_READ_PAUSE_MS = 500;

function smoothScrollTo(top: number, duration: number) {
  const target = Math.max(0, top);
  const start = window.scrollY;
  const distance = target - start;
  if (Math.abs(distance) < 2) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    window.scrollTo(0, target);
    return;
  }

  const startTime = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, start + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

const BRAND_NAME = "Smart Lead Conversion";
const AUDIENCE_LINE = "Built for home remodeling contractors";
const CHANNELS = ["Website forms", "Facebook leads", "Email", "SMS"];
const SETUP_LINE = "Plugs into your current forms and lead sources. We handle the setup.";
const PROOF_STAT = "78% of leads go with whoever replies first.";
const INSTANT_TRANSITION_CUE = "Same lead. Booked in 2 minutes.";

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
    label: "Slow reply",
    sublabel: "Owner texts back between jobs",
    accent: "slow" as const,
    script: withoutUsScript,
  },
  {
    id: "with" as const,
    label: "Instant reply",
    sublabel: "Reply on every channel in seconds",
    accent: "instant" as const,
    script: withUsScript,
  },
];

export function ImprovementDemo() {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"without" | "with">("without");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [playSlowToken, setPlaySlowToken] = useState(0);
  const [playInstantToken, setPlayInstantToken] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [mobilePhase, setMobilePhase] = useState<"idle" | "slow" | "instant">("idle");
  const [showInstantCue, setShowInstantCue] = useState(false);
  const autoSequenceRef = useRef(false);
  const autoPlayedRef = useRef(false);
  const demoRef = useRef<HTMLElement>(null);
  const channelsRef = useRef<HTMLDivElement>(null);
  const slowRowRef = useRef<HTMLDivElement>(null);
  const instantRowRef = useRef<HTMLDivElement>(null);
  const instantCueRef = useRef<HTMLParagraphElement>(null);
  const bothDone = doneIds.has("without") && doneIds.has("with");
  const anyPlaying = playingIds.size > 0;
  const useMobileLayout = isMobile;

  const playButtonLabel = anyPlaying
    ? "Playing both…"
    : hasInteracted
      ? "Play both again"
      : "Play both";

  const setDemoDone = (id: string, done: boolean) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const setDemoPlaying = (id: string, playing: boolean) => {
    setPlayingIds((prev) => {
      const next = new Set(prev);
      if (playing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const playBoth = useCallback(() => {
    setHasInteracted(true);
    setShowInstantCue(false);
    if (useMobileLayout) {
      autoSequenceRef.current = true;
      setMobilePhase("slow");
      setPlaySlowToken((t) => t + 1);
    } else {
      autoSequenceRef.current = false;
      setMobilePhase("idle");
      setPlaySlowToken((t) => t + 1);
      setPlayInstantToken((t) => t + 1);
    }
  }, [useMobileLayout]);

  useEffect(() => {
    if (!AUTO_PLAY_ON_VIEW) return;

    const el = demoRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || autoPlayedRef.current) return;
        autoPlayedRef.current = true;
        observer.disconnect();
        window.setTimeout(() => playBoth(), 400);
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [playBoth]);

  const scrollToWatchAgainAnchor = useCallback(() => {
    const el = channelsRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_TO_SLOW_TOP_PADDING;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  }, []);

  const scrollToInstantDemo = useCallback(() => {
    const el = instantCueRef.current ?? instantRowRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_TO_INSTANT_TOP_PADDING;
      smoothScrollTo(top, SCROLL_DURATION_MS);
    });
  }, []);

  const watchAgain = useCallback(() => {
    setResetToken((t) => t + 1);
    setPlayingIds(new Set());
    setDoneIds(new Set());
    setShowInstantCue(false);
    setMobilePhase("idle");

    window.setTimeout(() => {
      scrollToWatchAgainAnchor();
      window.setTimeout(() => playBoth(), 800);
    }, 150);
  }, [playBoth, scrollToWatchAgainAnchor]);

  const replayDesktop = useCallback(() => {
    setResetToken((t) => t + 1);
    setPlayingIds(new Set());
    setDoneIds(new Set());
    window.setTimeout(() => playBoth(), 150);
  }, [playBoth]);

  const handleDemoComplete = (id: "without" | "with") => {
    if (id === "with") {
      setMobilePhase("idle");
      autoSequenceRef.current = false;
      return;
    }
    if (!useMobileLayout || !autoSequenceRef.current) return;

    setTimeout(() => {
      setShowInstantCue(true);
      setMobilePhase("instant");

      setTimeout(() => {
        scrollToInstantDemo();
        setTimeout(() => setPlayInstantToken((t) => t + 1), SCROLL_DURATION_MS + 100);
      }, CUE_READ_PAUSE_MS);
    }, TRANSITION_PAUSE_MS);
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

        <div ref={channelsRef} className="mx-auto mt-6 max-w-2xl">
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

        {!useMobileLayout && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={hasInteracted ? replayDesktop : playBoth}
              disabled={anyPlaying}
              className={`inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 ${
                !hasInteracted ? "animate-pulse ring-4 ring-primary/20" : ""
              }`}
            >
              <PlayIcon />
              {playButtonLabel}
            </button>
          </div>
        )}
      </header>

      {isMobile && !MINI_PHONE && (
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 px-6 pb-6">
          {showInstantCue && mobileTab === "with" && (
            <p className="animate-in fade-in mx-auto rounded-full bg-teal-50 px-4 py-2 text-center text-sm font-semibold tracking-tight text-teal-900 ring-1 ring-teal-200 duration-300">
              {INSTANT_TRANSITION_CUE}
            </p>
          )}
          {!SIMPLE_DEMO && !showInstantCue && (
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tap each tab to compare</span> the two outcomes
            </p>
          )}
          <div
            role="tablist"
            aria-label="Compare slow vs instant reply"
            className="flex w-full rounded-xl border border-border bg-muted/50 p-1 shadow-inner"
          >
            {demos.map((demo) => {
              const isActive = mobileTab === demo.id;
              return (
                <button
                  key={demo.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => {
                    autoSequenceRef.current = false;
                    setShowInstantCue(false);
                    setMobileTab(demo.id);
                  }}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                    isActive
                      ? demo.accent === "instant"
                        ? "bg-teal-700 text-white shadow-md ring-2 ring-teal-600/40"
                        : "bg-rose-800 text-white shadow-md ring-2 ring-rose-700/40"
                      : "border border-dashed border-muted-foreground/30 bg-transparent text-muted-foreground/70 hover:border-muted-foreground/50 hover:bg-background/50 hover:text-muted-foreground"
                  }`}
                >
                  {demo.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main
        ref={demoRef}
        className={
          useMobileLayout
            ? "mx-auto flex w-full max-w-lg flex-col gap-6 px-5 pb-16 sm:max-w-2xl sm:gap-8 sm:px-8"
            : "mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-16 md:grid-cols-2"
        }
        aria-live="polite"
      >
        {demos.map((demo, index) => (
          <Fragment key={demo.id}>
            <DemoRow
              rowRef={demo.id === "without" ? slowRowRef : demo.id === "with" ? instantRowRef : undefined}
              scrollAnchor={useMobileLayout && demo.id === "without"}
              layout={useMobileLayout ? "stacked" : "column"}
              label={demo.label}
              sublabel={demo.sublabel}
              accent={demo.accent}
              mini={useMobileLayout && MINI_PHONE}
              isPlaying={playingIds.has(demo.id)}
              isDone={doneIds.has(demo.id)}
              contactName="Sarah Mitchell"
              script={demo.script}
              playToken={demo.id === "without" ? playSlowToken : playInstantToken}
              resetToken={resetToken}
              simpleMode={SIMPLE_DEMO}
              showGuide={false}
              onPlayingChange={(playing) => setDemoPlaying(demo.id, playing)}
              onDoneChange={(done) => setDemoDone(demo.id, done)}
              onComplete={() => handleDemoComplete(demo.id)}
              onInteract={() => setHasInteracted(true)}
            />
            {useMobileLayout && index === 0 && showInstantCue && (
              <p
                ref={instantCueRef}
                className="animate-in fade-in mx-auto w-fit rounded-full bg-teal-50 px-4 py-2 text-center text-sm font-semibold tracking-tight text-teal-900 ring-1 ring-teal-200 duration-300"
              >
                {INSTANT_TRANSITION_CUE}
              </p>
            )}
          </Fragment>
        ))}

        {useMobileLayout && bothDone && !anyPlaying && (
          <div className="flex justify-center pt-2">
            <button
              onClick={watchAgain}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90"
            >
              <PlayIcon />
              Watch again
            </button>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <p className="text-lg font-medium md:text-xl">Every hour you wait costs you jobs. We fix that.</p>
        <p className="mt-2 text-sm text-muted-foreground">{PROOF_STAT}</p>
        <p className="mt-2 text-sm text-muted-foreground">{SETUP_LINE}</p>
      </footer>
    </div>
  );
}

function DemoRow({
  rowRef,
  scrollAnchor,
  layout,
  label,
  sublabel,
  accent,
  mini,
  isPlaying,
  isDone,
  contactName,
  script,
  playToken,
  resetToken,
  simpleMode,
  showGuide,
  onPlayingChange,
  onDoneChange,
  onComplete,
  onInteract,
}: {
  rowRef?: RefObject<HTMLDivElement | null>;
  scrollAnchor?: boolean;
  layout: "stacked" | "column";
  label: string;
  sublabel: string;
  accent: "instant" | "slow";
  mini?: boolean;
  isPlaying: boolean;
  isDone: boolean;
  contactName: string;
  script: Step[];
  playToken: number;
  resetToken: number;
  simpleMode?: boolean;
  showGuide?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onDoneChange?: (done: boolean) => void;
  onComplete?: () => void;
  onInteract?: () => void;
}) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [outcomeTone, setOutcomeTone] = useState<"instant" | "slow" | null>(null);
  const [fitScale, setFitScale] = useState(PHONE_SCALE);
  const rowInnerRef = useRef<HTMLDivElement>(null);
  const isStacked = layout === "stacked";
  const phoneScale = mini ? (isStacked ? fitScale : PHONE_SCALE) : 1;
  const phoneWidth = mini ? Math.round(PHONE_WIDTH * phoneScale) : PHONE_WIDTH;
  const phoneHeight = mini ? Math.round(phoneShellHeight() * phoneScale) : undefined;

  useEffect(() => {
    if (!isStacked || !mini) return;
    const el = rowInnerRef.current;
    if (!el) return;

    const updateScale = () => {
      const rowWidth = el.clientWidth;
      const labelWidth = rowWidth * MOBILE_LABEL_SHARE;
      const phoneSpace = rowWidth - labelWidth - 10;
      const scale = Math.min(PHONE_SCALE, phoneSpace / PHONE_WIDTH);
      setFitScale(Math.max(PHONE_SCALE_MIN, scale));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isStacked, mini]);

  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      rowInnerRef.current = node;
      if (rowRef) rowRef.current = node;
    },
    [rowRef],
  );

  const cardTone =
    accent === "instant"
      ? {
          base: "border-border bg-muted/30",
          playing: "border-teal-300 bg-teal-50/40 ring-2 ring-teal-200/60",
          done: "border-teal-300 bg-teal-50/50 shadow-sm",
        }
      : {
          base: "border-border bg-muted/30",
          playing: "border-rose-300 bg-rose-50/40 ring-2 ring-rose-200/60",
          done: "border-border bg-muted/20 opacity-75",
        };

  const cardClass = isPlaying ? cardTone.playing : isDone ? cardTone.done : cardTone.base;

  const chatDemo = (
    <ChatDemo
      label={label}
      sublabel={sublabel}
      accent={accent}
      contactName={contactName}
      script={script}
      playToken={playToken}
      resetToken={resetToken}
      simpleMode={simpleMode}
      mini={mini}
      phoneScale={phoneScale}
      hideLabels
      hideOutcome={isStacked}
      showGuide={showGuide}
      onPlayingChange={onPlayingChange}
      onDoneChange={onDoneChange}
      onOutcomeChange={(text, tone) => {
        setOutcome(text);
        setOutcomeTone(tone);
      }}
      onComplete={onComplete}
      onInteract={onInteract}
    />
  );

  if (!isStacked) {
    return (
      <div ref={rowRef} className="flex flex-col items-center">
        <div className="mb-5 text-center">
          <DemoLabel
            label={label}
            sublabel={sublabel}
            accent={accent}
            centered
            outcome={null}
            outcomeTone={null}
          />
        </div>
        <div style={{ width: phoneWidth, height: phoneHeight }}>{chatDemo}</div>
      </div>
    );
  }

  return (
    <div
      ref={setRowRef}
      style={scrollAnchor ? { scrollMarginTop: SCROLL_TO_SLOW_TOP_PADDING } : undefined}
      className={`flex w-full items-center gap-2.5 rounded-2xl border p-3 transition-all duration-300 ${cardClass}`}
    >
      <div className="w-[40%] shrink-0">
        <DemoLabel
          label={label}
          sublabel={sublabel}
          accent={accent}
          mini={mini}
          outcome={outcome}
          outcomeTone={outcomeTone}
        />
      </div>
      <div className="ml-auto shrink-0" style={{ width: phoneWidth, height: phoneHeight }}>
        {chatDemo}
      </div>
    </div>
  );
}

function DemoLabel({
  label,
  sublabel,
  accent,
  mini,
  centered,
  outcome,
  outcomeTone,
}: {
  label: string;
  sublabel: string;
  accent: "instant" | "slow";
  mini?: boolean;
  centered?: boolean;
  outcome?: string | null;
  outcomeTone?: "instant" | "slow" | null;
}) {
  return (
    <div className={centered ? "text-center" : "text-left"}>
      <span
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold ${
          mini ? "px-2.5 py-1 text-[11px]" : "gap-2 px-4 py-1.5 text-sm"
        } ${
          accent === "instant"
            ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
            : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
        }`}
      >
        <span
          className={`shrink-0 rounded-full ${mini ? "h-1.5 w-1.5" : "h-2 w-2"} ${accent === "instant" ? "bg-teal-600" : "bg-rose-700"}`}
        />
        {label}
      </span>
      <p className={`mt-2 text-muted-foreground ${mini ? "text-[11px] leading-relaxed" : "text-sm leading-relaxed"}`}>
        {sublabel}
      </p>
      {outcome && outcomeTone && (
        <OutcomeBadge text={outcome} tone={outcomeTone} mini={mini} className="mt-2.5 w-full text-left leading-relaxed" />
      )}
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
  simpleMode,
  mini,
  phoneScale = 1,
  hideLabels,
  hideOutcome,
  showGuide,
  onPlayingChange,
  onDoneChange,
  onOutcomeChange,
  onComplete,
  onInteract,
}: {
  label: string;
  sublabel: string;
  accent: "instant" | "slow";
  contactName: string;
  script: Step[];
  playToken: number;
  resetToken: number;
  simpleMode?: boolean;
  mini?: boolean;
  phoneScale?: number;
  hideLabels?: boolean;
  hideOutcome?: boolean;
  showGuide?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onDoneChange?: (done: boolean) => void;
  onOutcomeChange?: (outcome: string | null, tone: "instant" | "slow" | null) => void;
  onComplete?: () => void;
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
  const onDoneChangeRef = useRef(onDoneChange);
  const onOutcomeChangeRef = useRef(onOutcomeChange);
  const onCompleteRef = useRef(onComplete);
  const onInteractRef = useRef(onInteract);
  const outcomeTone = script.find((s): s is Extract<Step, { kind: "banner" }> => s.kind === "banner")?.tone;

  onPlayingChangeRef.current = onPlayingChange;
  onDoneChangeRef.current = onDoneChange;
  onOutcomeChangeRef.current = onOutcomeChange;
  onCompleteRef.current = onComplete;
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
    onDoneChangeRef.current?.(false);
    onOutcomeChangeRef.current?.(null, null);
    onInteractRef.current?.();

    let elapsed = 0;
    const stepDelay = (ms: number) => Math.max(120, Math.round(ms * DEMO_SPEED));
    const typingLead = Math.round(200 * DEMO_SPEED);

    script.forEach((step, i) => {
      if (step.kind === "msg" && step.typingFor) {
        timers.current.push(setTimeout(() => setTyping(step.typingFor!), elapsed + typingLead));
      }
      elapsed += stepDelay(step.delay);
      timers.current.push(
        setTimeout(() => {
          setTyping(null);
          setVisible((v) => [...v, step]);
          if (step.kind === "banner") {
            setOutcome(step.text);
            const tone = step.tone === "success" ? "instant" : "slow";
            onOutcomeChangeRef.current?.(step.text, tone);
          }
          if (i === script.length - 1) {
            setPlaying(false);
            setDone(true);
            onPlayingChangeRef.current?.(false);
            onDoneChangeRef.current?.(true);
            onCompleteRef.current?.();
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
    onDoneChangeRef.current?.(false);
    onOutcomeChangeRef.current?.(null, null);
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
    <div className="flex w-full flex-col items-center">
      {!hideLabels && (
        <div className={mini ? "mb-2" : "mb-5"}>
          <DemoLabel label={label} sublabel={sublabel} accent={accent} mini={mini} />
        </div>
      )}

      <ScaledPhoneShell scale={phoneScale}>
        <PhoneFrame contactName={contactName}>
          <div ref={scrollRef} className="flex h-full flex-col gap-2 overflow-y-auto px-4 py-4">
            {visible.length === 0 && !typing && !simpleMode && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-xs text-neutral-400">Press play to start the conversation</p>
              {showGuide && (
                <p className="text-[11px] font-medium text-neutral-500">Starts automatically when you scroll here</p>
              )}
              </div>
            )}
            {visible.map((step, i) => (
              <StepView key={i} step={step} hideBanner />
            ))}
            {typing && <TypingBubble side={typing} />}
          </div>
        </PhoneFrame>
      </ScaledPhoneShell>

      {outcome && !hideOutcome && (
        <OutcomeBadge
          text={outcome}
          tone={outcomeTone === "success" ? "instant" : "slow"}
          mini={mini}
          beneathPhone
        />
      )}

      {!simpleMode && (
        <div className="mt-3 flex w-full items-center justify-center gap-3">
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
      )}
    </div>
  );
}

function OutcomeBadge({
  text,
  tone,
  mini,
  beneathPhone,
  className = "",
}: {
  text: string;
  tone: "instant" | "slow";
  mini?: boolean;
  beneathPhone?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-in fade-in font-semibold duration-300 ${
        beneathPhone
          ? "mt-4 w-full rounded-2xl px-4 py-3 text-center text-sm leading-snug"
          : mini
            ? "rounded-lg px-2.5 py-1.5 text-[10px] leading-snug"
            : "rounded-xl px-4 py-2.5 text-sm leading-snug"
      } ${
        tone === "instant"
          ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
          : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
      } ${className}`}
    >
      {tone === "instant" ? "✓ " : "✕ "}
      {text}
    </div>
  );
}

function StepView({ step, hideBanner, compact }: { step: Step; hideBanner?: boolean; compact?: boolean }) {
  if (step.kind === "msg") return <Bubble side={step.side} text={step.text} time={step.time} compact={compact} />;
  if (step.kind === "card") return <CardView step={step} compact={compact} />;
  if (step.kind === "gap") return <GapView text={step.text} compact={compact} />;
  if (step.kind === "note")
    return (
      <div className={compact ? "my-1 text-center" : "my-2 text-center"}>
        <span
          className={`inline-block rounded-full font-medium ${
            compact ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[11px]"
          } ${step.tone === "warn" ? "bg-rose-50 text-rose-800" : "bg-neutral-100 text-neutral-500"}`}
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
          ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
          : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
      }`}
    >
      {step.tone === "success" ? "✓ " : "✕ "}
      {step.text}
    </div>
  );
}

function GapView({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "my-1.5" : "my-3 gap-3"}`}>
      <div className="h-px flex-1 bg-neutral-200" />
      <span
        className={`shrink-0 font-semibold uppercase tracking-wide text-rose-700 ${
          compact ? "text-[7px] leading-tight" : "text-[11px]"
        }`}
      >
        {text}
      </span>
      <div className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}

function CardView({ step, compact }: { step: Extract<Step, { kind: "card" }>; compact?: boolean }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className={`rounded-lg border border-neutral-200 bg-white shadow-sm ${compact ? "p-1.5" : "rounded-xl p-3"}`}>
        <div className={`flex items-start ${compact ? "gap-1" : "gap-2"}`}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-md bg-teal-100 ${
              compact ? "h-5 w-5 text-[10px]" : "h-8 w-8 rounded-lg text-sm"
            }`}
          >
            📋
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-neutral-900 ${compact ? "text-[8px]" : "text-[12px]"}`}>
              New estimate request
            </p>
            <p className={`text-neutral-600 ${compact ? "mt-0 text-[7px]" : "mt-0.5 text-[11px]"}`}>
              {step.name} · {step.project}
            </p>
            <p className={`text-neutral-500 ${compact ? "text-[7px]" : "mt-1 text-[11px]"}`}>{step.details}</p>
            <div className={`flex items-center gap-2 ${compact ? "mt-0.5" : "mt-2"}`}>
              <span
                className={`rounded bg-neutral-100 font-medium text-neutral-600 ${
                  compact ? "px-1 py-px text-[6px]" : "rounded-md px-2 py-0.5 text-[10px]"
                }`}
              >
                {step.budget}
              </span>
            </div>
            {!compact && <p className="mt-2 text-[10px] text-neutral-400">{step.submitted}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, text, time, compact }: { side: Side; text: string; time: string; compact?: boolean }) {
  const mine = side === "me";
  return (
    <div
      className={`flex flex-col ${mine ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      <div
        className={`max-w-[85%] leading-snug ${
          compact ? "rounded-xl px-2 py-1 text-[9px]" : "max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px]"
        } ${mine ? "rounded-br-md bg-teal-700 text-white" : "rounded-bl-md bg-[#E9E9EB] text-neutral-900"}`}
      >
        {text}
      </div>
      {!compact && <span className="mt-1 px-1 text-[10px] text-neutral-400">{time}</span>}
    </div>
  );
}

function TypingBubble({ side, compact }: { side: Side; compact?: boolean }) {
  const mine = side === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-center gap-1 ${
          compact ? "rounded-xl px-2 py-1.5" : "rounded-2xl px-3.5 py-2.5"
        } ${mine ? "rounded-br-md bg-teal-700" : "rounded-bl-md bg-[#E9E9EB]"}`}
      >
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className={`animate-bounce rounded-full ${compact ? "h-1 w-1" : "h-1.5 w-1.5"} ${mine ? "bg-white/80" : "bg-neutral-500"}`}
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ScaledPhoneShell({ scale, children }: { scale: number; children: ReactNode }) {
  if (scale >= 0.99) {
    return <div className="w-[340px] shrink-0">{children}</div>;
  }

  const scaledWidth = Math.round(PHONE_WIDTH * scale);
  const scaledHeight = Math.round(phoneShellHeight() * scale);

  return (
    <div className="relative shrink-0" style={{ width: scaledWidth, height: scaledHeight }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: PHONE_WIDTH, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

function phoneShellHeight() {
  // bezel + status bar + contact header + chat + home indicator
  return 22 + 40 + 64 + PHONE_CHAT_HEIGHT + 22;
}

function PhoneFrame({ contactName, children }: { contactName: string; children: ReactNode }) {
  const initials = contactName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="relative w-[340px] shrink-0">
      <div className="rounded-[2.75rem] bg-[#141414] p-[11px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
        <div className="overflow-hidden rounded-[2.125rem] bg-white">
          <div className="relative flex items-center justify-between bg-white px-7 pb-2 pt-4 text-[12px] font-semibold text-neutral-900">
            <span>9:41</span>
            <div className="absolute left-1/2 top-3 h-[28px] w-[88px] -translate-x-1/2 rounded-full bg-neutral-950" />
            <span className="flex items-center gap-1.5">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </span>
          </div>

          <div className="flex items-center gap-3 border-b border-neutral-200/70 bg-white px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-xs font-semibold text-neutral-600">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight text-neutral-900">{contactName}</p>
              <p className="text-[11px] text-neutral-500">Text Message · SMS</p>
            </div>
          </div>

          <div className="bg-[#ececee]" style={{ height: PHONE_CHAT_HEIGHT }}>
            {children}
          </div>

          <div className="flex justify-center bg-[#ececee] pb-3 pt-1.5">
            <div className="h-1 w-[110px] rounded-full bg-neutral-900/20" />
          </div>
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
