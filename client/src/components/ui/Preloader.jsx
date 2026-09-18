import { useEffect, useState } from "react";
import { Server, Loader2, Sparkles } from "lucide-react";

/**
 * Branded two-layer Preloader component
 * Layer 1: App-boot / branded pulse on dark base (#0C0A14)
 * Layer 2: Automatic Cold-Start detector (after ~3s) to explain Render free-tier wake up delay
 */
export default function Preloader({
  message = "Loading URC Building Values…",
  submessage,
  fullScreen = true,
  coldStartThresholdMs = 3000,
  className = "",
}) {
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Detect if the request takes longer than coldStartThresholdMs
    const timer = setTimeout(() => {
      setIsColdStarting(true);
    }, coldStartThresholdMs);

    // Track elapsed time for cold start feedback
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [coldStartThresholdMs]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-[150] bg-base flex flex-col items-center justify-center p-4 select-none"
    : `min-h-[300px] w-full flex flex-col items-center justify-center p-6 bg-base/50 rounded-2xl select-none ${className}`;

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* Central Branded Logo Animation */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute w-32 h-32 rounded-full bg-accent/20 blur-xl animate-pulse pointer-events-none" />

        {/* App Logo Mark */}
        <div className="relative z-10 p-2.5 rounded-2xl bg-surface/80 border border-line shadow-pop flex items-center justify-center">
          <img
            src="/Urc_logo.svg"
            alt="URC Building Values"
            className="h-10 w-auto max-w-[140px] object-contain animate-pulse"
          />
        </div>
      </div>

      {/* Main Status Text */}
      <div className="text-center max-w-sm mx-auto space-y-2">
        <h3 className="text-base sm:text-lg font-semibold text-ink tracking-tight flex items-center justify-center gap-2">
          <span>{isColdStarting ? "Starting Backend Service" : message}</span>
          <Loader2 size={16} className="animate-spin text-accent-light shrink-0" />
        </h3>

        {/* Submessage or Cold-Start Explanation */}
        {isColdStarting ? (
          <div className="mt-3 p-3.5 rounded-xl bg-surface border border-line text-left shadow-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-accent/15 text-accent-light shrink-0 mt-0.5">
                <Server size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink font-medium leading-relaxed">
                  Waking up the server from sleep…
                </p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Free-tier instances spin down during inactivity and take ~30–50s to boot. Thanks for your patience!
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/50 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Sparkles size={11} className="text-accent-light" />
                    Connecting…
                  </span>
                  <span>{elapsedSeconds}s elapsed</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          submessage && <p className="text-xs sm:text-sm text-muted">{submessage}</p>
        )}
      </div>
    </div>
  );
}
