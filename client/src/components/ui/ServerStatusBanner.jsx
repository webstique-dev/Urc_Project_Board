import { useState, useEffect } from "react";
import { Server, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  subscribeBackendReadiness,
  checkBackendReadiness,
  resetBackendReadiness,
} from "../../api/backendReadiness.js";

export default function ServerStatusBanner() {
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

  // If connected and idle, no banner is needed
  if (readiness.status === "ready" || readiness.status === "idle") {
    return null;
  }

  // Cold Start In-Progress Notification (Non-blocking, sticky top banner)
  if (readiness.status === "cold_start" || readiness.isColdStart) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-2 text-xs sm:text-sm flex items-center justify-between gap-3 sticky top-14 z-30 backdrop-blur-md animate-in slide-in-from-top-1 duration-200">
        <div className="flex items-center gap-2 min-w-0">
          <Server size={15} className="text-amber-700 animate-pulse shrink-0" />
          <span className="font-semibold text-amber-950 truncate">
            Waking up server (Render Cold Start)
          </span>
          <span className="text-amber-700 hidden sm:inline">·</span>
          <span className="text-amber-800 text-xs hidden sm:inline truncate">
            Free tier instances take ~25–45s to boot when idle.
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs font-semibold text-amber-900">
          <span>{readiness.elapsedSeconds}s</span>
          <RefreshCw size={13} className="animate-spin text-amber-700" />
        </div>
      </div>
    );
  }

  // Connection Error / Cold Start Timeout View
  if (readiness.status === "error") {
    return (
      <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-950 px-4 py-2.5 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sticky top-14 z-30 backdrop-blur-md animate-in slide-in-from-top-1 duration-200 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-rose-600/15 text-rose-700 shrink-0">
            <AlertTriangle size={15} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-rose-950 truncate">
              Unable to reach backend server
            </p>
            <p className="text-[11px] text-rose-800 sm:truncate">
              The free Render instance may need an extra wake-up attempt, or your internet is offline.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="self-start sm:self-auto shrink-0 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={13} className={isRetrying ? "animate-spin" : ""} />
          <span>{isRetrying ? "Reconnecting…" : "Retry connection"}</span>
        </button>
      </div>
    );
  }

  return null;
}
