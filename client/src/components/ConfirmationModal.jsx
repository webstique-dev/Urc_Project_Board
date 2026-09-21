import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

export default function ConfirmationModal({
  isOpen = true,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText,
  cancelText = "Cancel",
  isDestructive = false,
  variant, // 'destructive' | 'danger' | 'warning' | 'primary'
  loading = false,
  confirmDisabled = false,
  icon,
  children,
}) {
  const isDanger = isDestructive || variant === "destructive" || variant === "danger";
  const defaultConfirmText = isDanger ? "Delete" : "Confirm";
  const finalConfirmText = confirmText || defaultConfirmText;
  const confirmBtnRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Focus confirm button when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200"
      onClick={!loading ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 shadow-pop text-ink relative transform transition-all duration-200 animate-in zoom-in-95"
      >
        <div className="flex items-start gap-3.5 sm:gap-4">
          {/* Icon */}
          <div
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
              isDanger
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-accent/10 text-accent border border-accent/20"
            }`}
          >
            {icon ? (
              icon
            ) : isDanger ? (
              <Trash2 size={20} className="shrink-0" />
            ) : (
              <AlertTriangle size={20} className="shrink-0" />
            )}
          </div>

          {/* Title & Message */}
          <div className="flex-1 min-w-0">
            <h3 id="confirmation-modal-title" className="text-base font-semibold text-ink leading-snug">
              {title}
            </h3>
            {message && (
              <p
                id="confirmation-modal-description"
                className="text-sm text-muted mt-1.5 leading-relaxed break-words"
              >
                {message}
              </p>
            )}
            {children && <div className="mt-3">{children}</div>}
          </div>

          {/* Top-right close button */}
          {!loading && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-muted hover:text-ink hover:bg-slate-100 w-8 h-8 -mr-1 -mt-1 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-line/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg bg-surface hover:bg-surface-2 text-ink border border-line transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation shadow-sm cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 touch-manipulation cursor-pointer ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/40 shadow-sm"
                : "bg-accent hover:bg-accent-dark text-white focus:ring-accent/40 shadow-sm"
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin -ml-0.5 text-white" />}
            <span>{loading ? "Processing…" : finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
