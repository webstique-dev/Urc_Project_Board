import { useEffect, useState } from "react";
import { Server, Loader2, Database, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import {
  subscribeBackendReadiness,
  checkBackendReadiness,
  resetBackendReadiness,
} from "../../api/backendReadiness.js";

/**
 * Branded Preloader component matching the app's warm cream/stone palette (#FAF8F5, #1C1917, #B45309).
 * Uses real backend readiness states, live elapsed seconds, and gives a direct Retry action on timeout.
 */
export default function Preloader({
  message = "Loading URC Building Values…",
  submessage,
  fullScreen = true,
  className = "",
}) {
  const [readiness, setReadiness] = useState({
    status: "idle",
    isColdStart: false,
    elapsedSeconds: 0,
    attempt: 0,
    maxAttempts: 6,
    error: null,
    message: "",
  });
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    return subscribeBackendReadiness((state) => {
      setReadiness(state);
      if (state.status === "ready" || state.status === "error") {
        setIsRetrying(false);
      }
    });
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    resetBackendReadiness();
    await checkBackendReadiness(true);
    setIsRetrying(false);
  };

  const isColdStart = readiness.isColdStart || readiness.status === "cold_start";
  const isError = readiness.status === "error";

  const containerClasses = fullScreen
    ? "fixed inset-0 z-[150] bg-canvas flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
    : `min-h-[300px] w-full flex flex-col items-center justify-center p-6 bg-surface-2/40 border border-line/60 rounded-2xl select-none ${className}`;

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* Central Branded Logo with Ambient Glow */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute w-36 h-36 rounded-full bg-amber-500/15 blur-2xl animate-pulse pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full bg-stone-900/10 blur-xl pointer-events-none" />
        <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-accent/20 animate-[spin_12s_linear_infinite] pointer-events-none" />

        <div className="relative z-10 p-3.5 rounded-2xl bg-surface border border-line shadow-pop flex items-center justify-center transition-transform duration-300">
          <img
            src="/Urc_logo.svg"
            alt="URC Building Values"
            className="h-10 sm:h-11 w-auto max-w-[150px] object-contain"
          />
        </div>
      </div>

      {/* Main Status Text & Animated Progress */}
      <div className="text-center max-w-sm w-full mx-auto space-y-3 px-2">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight flex items-center justify-center gap-2">
            <span>
              {isError
                ? "Server Connection Issue"
                : isColdStart
                ? "Waking Up Cloud Server"
                : message}
            </span>
            {!isError && <Loader2 size={16} className="animate-spin text-accent shrink-0" />}
          </h3>
          {submessage && !isColdStart && !isError && (
            <p className="text-xs text-muted leading-relaxed">{submessage}</p>
          )}
        </div>

        {/* Progress bar (hidden on error) */}
        {!isError && (
          <div className="w-full max-w-[240px] mx-auto h-1.5 bg-surface-3/60 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 bg-gradient-to-r from-stone-800 via-amber-700 to-stone-800 rounded-full w-2/5 animate-[shimmerSlide_1.6s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Real Cold-Start Card */}
        {isColdStart && !isError && (
          <div className="mt-4 p-4 rounded-xl bg-surface border border-line text-left shadow-pop animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 mt-0.5">
                <Server size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink font-semibold flex items-center justify-between">
                  <span>Waking up the cloud server…</span>
                  <span className="text-[11px] font-mono text-muted">{readiness.elapsedSeconds}s</span>
                </p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Render free tier instances spin down after 15 min of inactivity. Initial boot takes ~25–45s.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-[10.5px]">
              <div className="flex items-center gap-1.5 text-ink font-medium">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Frontend ready</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Database size={12} className="text-amber-600 animate-pulse shrink-0" />
                <span>
                  Booting API (attempt {readiness.attempt || 1}/{readiness.maxAttempts})…
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error / Timeout Recovery View */}
        {isError && (
          <div className="mt-4 p-4 rounded-xl bg-surface border border-rose-200 text-left shadow-pop animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                <AlertTriangle size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-rose-950 font-semibold">Backend took too long to respond</p>
                <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                  The server may still be completing its cold start or your network is disconnected.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-accent hover:bg-accent-dark active:bg-accent-dark text-white text-xs font-semibold rounded-lg px-4 py-2 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRetrying ? "animate-spin" : ""} />
                <span>{isRetrying ? "Retrying…" : "Retry connection"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
