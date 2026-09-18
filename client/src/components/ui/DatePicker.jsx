import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar } from "lucide-react";

/**
 * Reusable dark-themed DatePicker component with calendar popover
 *
 * Props:
 * - value: string | Date | null
 * - onChange: (dateString: string | null) => void
 * - placeholder?: string
 * - align?: "left" | "right"
 * - className?: string
 * - buttonClassName?: string
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = "Dates",
  align = "left",
  className = "",
  buttonClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Convert value to Date object for DayPicker
  const selectedDate = value ? new Date(value) : undefined;

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (date) => {
    if (!date) {
      onChange?.(null);
    } else {
      // Format as YYYY-MM-DD local ISO date string
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange?.(`${year}-${month}-${day}`);
    }
    setIsOpen(false);
  };

  const handleQuickSelect = (daysOffset) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    onChange?.(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setIsOpen(false);
  };

  const formattedDisplay = value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div ref={containerRef} data-card-popover="true" className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer select-none ${
          value
            ? "bg-accent/15 border-accent/40 text-accent-light hover:bg-accent/25"
            : "bg-surface-3 hover:bg-surface-2 border-line text-ink"
        } ${isOpen ? "ring-2 ring-accent/40 border-accent" : ""} ${buttonClassName}`}
      >
        <Calendar size={14} className={`shrink-0 ${value ? "text-accent-light" : "text-muted"}`} />
        <span>{formattedDisplay || placeholder}</span>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Select date"
          className={`absolute top-full mt-1.5 z-[70] p-3.5 rounded-2xl bg-surface border border-line shadow-pop text-ink max-w-[calc(100vw-32px)] animate-in fade-in-50 zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Quick shortcut buttons */}
          <div className="flex items-center justify-between gap-1.5 pb-2.5 mb-2 border-b border-line/60">
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className="px-2.5 py-1 text-xs rounded-md bg-surface-3 hover:bg-surface-2 border border-line text-ink font-medium transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1)}
              className="px-2.5 py-1 text-xs rounded-md bg-surface-3 hover:bg-surface-2 border border-line text-ink font-medium transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(7)}
              className="px-2.5 py-1 text-xs rounded-md bg-surface-3 hover:bg-surface-2 border border-line text-ink font-medium transition-colors cursor-pointer"
            >
              +1 Week
            </button>
          </div>

          {/* React Day Picker Calendar */}
          <div className="dark-theme-day-picker flex justify-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              showOutsideDays
              classNames={{
                months: "flex flex-col space-y-3",
                month_caption: "flex justify-between items-center px-1 mb-2",
                caption_label: "text-xs sm:text-sm font-bold text-ink tracking-tight",
                nav: "flex items-center gap-1",
                button_previous:
                  "w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer",
                button_next:
                  "w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer",
                month_grid: "w-full border-collapse",
                weekdays: "flex justify-between text-muted text-[10px] uppercase font-semibold pb-1.5",
                weekday: "w-8 text-center",
                weeks: "space-y-1",
                week: "flex justify-between w-full",
                day: "w-8 h-8 p-0 text-xs font-medium text-center relative focus-within:relative focus-within:z-20",
                day_button:
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-surface-2 text-ink cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent",
                selected: "!bg-accent !text-white font-bold shadow-sm rounded-lg hover:!bg-accent",
                today: "text-accent-light font-bold underline decoration-accent underline-offset-4",
                outside: "text-muted/30 opacity-40 hover:opacity-100",
                disabled: "text-muted/20 cursor-not-allowed",
              }}
            />
          </div>

          {/* Footer with Clear Date option */}
          {value && (
            <div className="pt-2.5 mt-2 border-t border-line/60 flex items-center justify-between">
              <span className="text-[11px] text-muted truncate">
                Selected: {formattedDisplay}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline px-1.5 py-0.5 transition-colors cursor-pointer"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
