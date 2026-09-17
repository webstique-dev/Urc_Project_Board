import { useEffect, useRef } from "react";

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] px-4 animate-in fade-in duration-200"
      onClick={!loading ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 shadow-pop text-ink relative transform transition-all duration-200 animate-in zoom-in-95"
      >
        <div className="flex items-start gap-3.5 sm:gap-4">
          {/* Icon */}
          <div
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
              isDanger
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                : "bg-accent/15 text-accent-light border border-accent/20"
            }`}
          >
            {icon ? (
              icon
            ) : isDanger ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
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
              aria-label="Close"
              className="text-muted hover:text-ink hover:bg-surface-3 p-1 rounded-lg transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-line/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-3 hover:bg-surface-2 text-ink/90 border border-line transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500/40 shadow-lg shadow-rose-950/30"
                : "bg-accent hover:bg-accent-dark text-white focus:ring-accent/40"
            }`}
          >
            {loading && (
              <svg
                className="animate-spin -ml-0.5 w-4 h-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            <span>{loading ? "Processing…" : finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
