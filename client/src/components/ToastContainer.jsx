import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const TYPE_CONFIG = {
  success: {
    iconBg: "bg-emerald-50 border border-emerald-200",
    iconColor: "text-emerald-600",
    border: "border-emerald-200",
    glow: "shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
    progressBg: "bg-emerald-500",
    defaultTitle: "Success",
    icon: <Check size={16} strokeWidth={2.5} className="shrink-0" />,
  },
  error: {
    iconBg: "bg-rose-50 border border-rose-200",
    iconColor: "text-rose-600",
    border: "border-rose-200",
    glow: "shadow-[0_4px_20px_rgba(244,63,94,0.12)]",
    progressBg: "bg-rose-500",
    defaultTitle: "Error",
    icon: <AlertCircle size={16} strokeWidth={2.5} className="shrink-0" />,
  },
  warning: {
    iconBg: "bg-amber-50 border border-amber-200",
    iconColor: "text-amber-600",
    border: "border-amber-200",
    glow: "shadow-[0_4px_20px_rgba(245,158,11,0.12)]",
    progressBg: "bg-amber-500",
    defaultTitle: "Warning",
    icon: <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />,
  },
  info: {
    iconBg: "bg-accent/10 border border-accent/20",
    iconColor: "text-accent",
    border: "border-accent/25",
    glow: "shadow-[0_4px_20px_rgba(12,102,228,0.12)]",
    progressBg: "bg-accent",
    defaultTitle: "Notice",
    icon: <Info size={16} strokeWidth={2.5} className="shrink-0" />,
  },
};

const POSITION_CLASSES = {
  "top-right": "top-4 right-4 sm:top-5 sm:right-5 items-end",
  "top-left": "top-4 left-4 sm:top-5 sm:left-5 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 sm:top-5 items-center",
  "bottom-right": "bottom-4 right-4 sm:bottom-5 sm:right-5 items-end",
  "bottom-left": "bottom-4 left-4 sm:bottom-5 sm:left-5 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-5 items-center",
};

function ToastItem({ toast, onDismiss }) {
  const { id, type = "info", title, message, duration = 4000 } = toast;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const [isExiting, setIsExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const remainingRef = useRef(duration);
  const startTimeRef = useRef(Date.now());

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 250);
  };

  useEffect(() => {
    if (!duration || duration <= 0) return;

    if (!paused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, remainingRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paused, duration]);

  const handleMouseEnter = () => {
    if (!duration || duration <= 0) return;
    setPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    if (!duration || duration <= 0) return;
    setPaused(false);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md border ${config.border} ${config.glow} rounded-xl p-3.5 sm:p-4 text-ink shadow-lg transition-all duration-200 transform ${
        isExiting
          ? "opacity-0 scale-95 translate-y-2"
          : "opacity-100 scale-100 translate-y-0 animate-in fade-in slide-in-from-top-2"
      } overflow-hidden pointer-events-auto`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={`w-7 h-7 shrink-0 rounded-lg ${config.iconBg} ${config.iconColor} flex items-center justify-center mt-0.5`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          {title ? (
            <h4 className="text-sm font-semibold text-ink leading-tight">{title}</h4>
          ) : (
            !message && <h4 className="text-sm font-semibold text-ink leading-tight">{config.defaultTitle}</h4>
          )}
          {message && (
            <p className={`text-xs sm:text-sm text-muted ${title ? "mt-1" : ""} leading-relaxed break-words`}>
              {message}
            </p>
          )}
        </div>

        {/* Manual Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close notification"
          className="shrink-0 p-1 -mr-1 -mt-1 text-muted hover:text-ink hover:bg-surface-2 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-accent/40"
        >
          <X size={14} className="shrink-0" />
        </button>
      </div>

      {/* Auto-dismiss countdown bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-line overflow-hidden">
          <div
            className={`h-full ${config.progressBg}`}
            style={{
              animation: `shrinkWidth ${duration}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast, position = "top-right" }) {
  if (!toasts || toasts.length === 0) return null;

  const positionClass = POSITION_CLASSES[position] || POSITION_CLASSES["top-right"];

  const content = (
    <div
      aria-label="Notifications"
      className={`fixed z-[100] pointer-events-none flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-md ${positionClass}`}
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={removeToast} />
      ))}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
