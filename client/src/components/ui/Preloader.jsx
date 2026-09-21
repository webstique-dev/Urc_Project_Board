import { useEffect, useState } from "react";
import { Server, Loader2, Database, CheckCircle2 } from "lucide-react";

/**
 * Branded two-layer Preloader component matching the app's warm cream/stone palette (#FAF8F5, #1C1917, #B45309).
 * Layer 1: App-boot / branded pulse on warm canvas (#FAF8F5) with progress shimmer
 * Layer 2: Automatic Cold-Start detector (after ~3s) with step indicators and elapsed timer
 */
export default function Preloader({
  message = "Loading URC Building Values…",
  submessage,
  fullScreen = true,
  coldStartThresholdMs = 2800,
  className = "",
}) {
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsColdStarting(true);
    }, coldStartThresholdMs);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [coldStartThresholdMs]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-[150] bg-canvas flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200"
    : `min-h-[300px] w-full flex flex-col items-center justify-center p-6 bg-surface-2/40 border border-line/60 rounded-2xl select-none ${className}`;

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* Central Branded Logo with Ambient Glow and Breathing Ring */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Ambient Warm Radiant Glow */}
        <div className="absolute w-36 h-36 rounded-full bg-amber-500/15 blur-2xl animate-pulse pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full bg-stone-900/10 blur-xl pointer-events-none" />

        {/* Outer Rotating Accent Ring */}
        <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-accent/20 animate-[spin_12s_linear_infinite] pointer-events-none" />

        {/* App Logo Mark Card */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-surface border border-line shadow-pop flex items-center justify-center transition-transform duration-300">
          <img
            src="/Urc_logo.svg"
            alt="URC Building Values"
            className="h-10 sm:h-11 w-auto max-w-[150px] object-contain transition-transform"
          />
        </div>
      </div>

      {/* Main Status Text & Animated Progress Indicator */}
      <div className="text-center max-w-sm w-full mx-auto space-y-3 px-2">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight flex items-center justify-center gap-2">
            <span>{isColdStarting ? "Connecting to Workspace" : message}</span>
            <Loader2 size={16} className="animate-spin text-accent shrink-0" />
          </h3>
          {submessage && !isColdStarting && (
            <p className="text-xs text-muted leading-relaxed">{submessage}</p>
          )}
        </div>

        {/* Sleek Gradient Indeterminate Progress Bar */}
        <div className="w-full max-w-[240px] mx-auto h-1.5 bg-surface-3/60 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute inset-y-0 bg-gradient-to-r from-stone-800 via-amber-700 to-stone-800 rounded-full w-2/5 animate-[shimmerSlide_1.6s_ease-in-out_infinite]" />
        </div>

        {/* Cold-Start Detailed Card (Appears gracefully when waiting on slow backend/Render dyno) */}
        {isColdStarting && (
          <div className="mt-4 p-4 rounded-xl bg-surface border border-line text-left shadow-pop animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 mt-0.5">
                <Server size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink font-semibold flex items-center justify-between">
                  <span>Waking up the cloud server…</span>
                  <span className="text-[11px] font-mono text-muted">{elapsedSeconds}s</span>
                </p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Free-tier instances spin down when idle. It takes ~25–40s to boot up. Your session and boards are loading.
                </p>
              </div>
            </div>

            {/* Micro Step Indicators */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-[10.5px]">
              <div className="flex items-center gap-1.5 text-ink font-medium">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Web client ready</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Database size={12} className="text-amber-600 animate-pulse shrink-0" />
                <span>Syncing database…</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
