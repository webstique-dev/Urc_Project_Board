import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

const TIME_OPTIONS = [
  "12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM",
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
];

const RECURRING_OPTIONS = ["Never", "Every day", "Every week", "Every month"];

const REMINDER_OPTIONS = [
  "None",
  "At time of due date",
  "5 Minutes before",
  "10 Minutes before",
  "15 Minutes before",
  "1 Hour before",
  "2 Hours before",
  "1 Day before",
  "2 Days before",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateToInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

function formatDateToISO(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Due Date",
  align = "left",
  className = "",
  buttonClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 320, maxH: 500, placement: "bottom" });

  // Form states
  const [displayMonth, setDisplayMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const [hasStartDate, setHasStartDate] = useState(false);
  const [startDateStr, setStartDateStr] = useState("");
  const [hasDueDate, setHasDueDate] = useState(!!value);
  const [selectedDueDate, setSelectedDueDate] = useState(
    value ? new Date(value) : new Date()
  );
  const [dueTime, setDueTime] = useState("12:00 PM");
  const [recurring, setRecurring] = useState("Never");
  const [reminder, setReminder] = useState("1 Day before");

  // Sync state whenever popover opens or external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDueDate(d);
        setDisplayMonth(d);
        setHasDueDate(true);
      }
    } else {
      setSelectedDueDate(new Date());
      setHasDueDate(false);
    }
  }, [value, isOpen]);

  // Position calculation with boundary clamping
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);

    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    let top = 0;
    let bottom = 0;
    let maxH = 500;
    let placement = "bottom";

    if (spaceBelow >= 340 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
      maxH = Math.min(520, Math.max(260, spaceBelow));
      placement = "bottom";
    } else {
      bottom = window.innerHeight - rect.top + 6;
      maxH = Math.min(520, Math.max(260, spaceAbove));
      placement = "top";
    }

    // Horizontal alignment with boundary clamping
    let left;
    if (align === "right") {
      left = rect.right - popoverWidth;
    } else {
      left = rect.left;
    }
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }

    setCoords({ top, bottom, left, width: popoverWidth, maxH, placement });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleReposition = () => updatePosition();
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);
      return () => {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
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

  // Calendar navigation
  const prevYear = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear() - 1, displayMonth.getMonth(), 1));
  };
  const prevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
  };
  const nextYear = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear() + 1, displayMonth.getMonth(), 1));
  };

  // Generate calendar grid
  const calendarDays = () => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill full weeks
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const handleSelectDay = (d) => {
    setSelectedDueDate(d);
    setHasDueDate(true);
  };

  const isSelected = (d) => {
    if (!hasDueDate || !selectedDueDate) return false;
    return (
      d.getDate() === selectedDueDate.getDate() &&
      d.getMonth() === selectedDueDate.getMonth() &&
      d.getFullYear() === selectedDueDate.getFullYear()
    );
  };

  const isToday = (d) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const handleSave = () => {
    if (hasDueDate && selectedDueDate) {
      onChange?.(formatDateToISO(selectedDueDate));
    } else {
      onChange?.(null);
    }
    setIsOpen(false);
  };

  const handleRemove = () => {
    setHasDueDate(false);
    setHasStartDate(false);
    onChange?.(null);
    setIsOpen(false);
  };

  const formattedDisplay = value
    ? new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
    : null;

  const monthLabel = displayMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Due date selector"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer select-none ${value
            ? "bg-accent/10 border-accent/30 text-accent font-semibold hover:bg-accent/15"
            : "bg-surface hover:bg-surface-2 border-line text-ink shadow-sm"
          } ${isOpen ? "ring-2 ring-accent/40 border-accent" : ""} ${buttonClassName}`}
      >
        <Calendar size={14} className={`shrink-0 ${value ? "text-accent" : "text-muted"}`} />
        <span>{formattedDisplay || placeholder}</span>
      </button>

      {/* Portaled & Viewport-Clamped Popover */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Dates"
            data-card-popover="true"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxH}px`,
              ...(coords.placement === "bottom"
                ? { top: `${coords.top}px`, bottom: "auto" }
                : { bottom: `${coords.bottom}px`, top: "auto" }),
            }}
            className="z-[9999] overflow-y-auto scrollbar-hide rounded-2xl bg-surface border border-line shadow-pop text-ink p-3.5 sm:p-4 animate-in fade-in-50 zoom-in-95 duration-150"
          >
            {/* Header with Title and Close Button */}
            <div className="relative flex items-center justify-center pb-2.5 mb-2.5 border-b border-line">
              <h3 className="text-xs sm:text-sm font-semibold text-ink">Dates</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close dates popover"
                className="absolute right-0 top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between px-0.5 mb-2.5">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={prevYear}
                  title="Previous Year"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <ChevronsLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={prevMonth}
                  title="Previous Month"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
              </div>

              <span className="text-xs sm:text-sm font-semibold text-ink tracking-tight">
                {monthLabel}
              </span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={nextMonth}
                  title="Next Month"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={nextYear}
                  title="Next Year"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-[11px] font-semibold text-muted mb-1">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="py-0.5">
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {calendarDays().map((item, idx) => {
                const selected = isSelected(item.date);
                const today = isToday(item.date);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(item.date)}
                    className={`h-7 sm:h-7.5 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer select-none ${selected
                        ? "bg-accent text-white font-bold shadow-sm ring-1 ring-accent"
                        : item.isCurrentMonth
                          ? "text-ink hover:bg-surface-2"
                          : "text-muted/40 hover:bg-surface-2/60"
                      } ${today && !selected ? "underline font-bold text-accent" : ""}`}
                  >
                    {item.date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Form Controls Section */}
            <div className="space-y-2.5 pt-2 border-t border-line text-xs">
              {/* Start Date */}
              <div>
                <span className="block text-[11px] font-semibold text-muted mb-0.5">
                  Start date
                </span>
                <div className="flex items-center gap-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasStartDate}
                      onChange={(e) => setHasStartDate(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hasStartDate
                          ? "bg-accent border-accent text-white"
                          : "border-line bg-surface hover:border-muted"
                        }`}
                    >
                      {hasStartDate && <Check size={11} strokeWidth={3} />}
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="M/D/YYYY"
                    disabled={!hasStartDate}
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className={`flex-1 rounded-lg border px-2.5 py-1 text-xs text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-accent ${hasStartDate
                        ? "bg-surface border-line"
                        : "bg-surface-2 border-line/60 text-muted/60 cursor-not-allowed"
                      }`}
                  />
                </div>
              </div>

              {/* Due Date & Time */}
              <div>
                <span className="block text-[11px] font-semibold text-muted mb-0.5">
                  Due date
                </span>
                <div className="flex items-center gap-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDueDate}
                      onChange={(e) => setHasDueDate(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hasDueDate
                          ? "bg-accent border-accent text-white"
                          : "border-line bg-surface hover:border-muted"
                        }`}
                    >
                      {hasDueDate && <Check size={11} strokeWidth={3} />}
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="M/D/YYYY"
                    disabled={!hasDueDate}
                    value={hasDueDate && selectedDueDate ? formatDateToInput(selectedDueDate) : ""}
                    onChange={(e) => {
                      const parsed = new Date(e.target.value);
                      if (!isNaN(parsed.getTime())) {
                        setSelectedDueDate(parsed);
                        setDisplayMonth(parsed);
                      }
                    }}
                    className={`flex-1 rounded-lg border px-2.5 py-1 text-xs text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-accent ${hasDueDate
                        ? "bg-surface border-line"
                        : "bg-surface-2 border-line/60 text-muted/60 cursor-not-allowed"
                      }`}
                  />
                  <div className="relative">
                    <select
                      disabled={!hasDueDate}
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className={`appearance-none rounded-lg border pl-2.5 pr-6 py-1 text-xs text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer ${hasDueDate
                          ? "bg-surface border-line"
                          : "bg-surface-2 border-line/60 text-muted/60 cursor-not-allowed"
                        }`}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Recurring */}
              <div>
                <span className="block text-[11px] font-semibold text-muted mb-0.5">
                  Recurring
                </span>
                <div className="relative">
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {RECURRING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
                  />
                </div>
              </div>

              {/* Set Due Date Reminder */}
              <div>
                <span className="block text-[11px] font-semibold text-muted mb-0.5">
                  Set due date reminder
                </span>
                <div className="relative">
                  <select
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {REMINDER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
                  />
                </div>
              </div>

              {/* Helper Note */}
              <p className="text-[10px] sm:text-[11px] text-muted leading-snug">
                Reminders will be sent to all members and watchers of this card.
              </p>

              {/* Action Buttons: Save and Remove */}
              <div className="pt-1.5 space-y-1.5">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-1.5 px-3.5 rounded-lg bg-accent hover:bg-accent-dark active:bg-accent-dark text-white font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full py-1.5 px-3.5 rounded-lg bg-surface-2 hover:bg-surface-3 active:bg-surface-3 text-ink font-medium text-xs sm:text-sm border border-line transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

