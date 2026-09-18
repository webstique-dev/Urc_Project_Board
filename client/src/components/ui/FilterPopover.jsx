import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Check } from "lucide-react";

/**
 * Reusable dark-themed Filter Popover component
 *
 * Props:
 * - groups: Array<{
 *     id: string,
 *     title: string,
 *     options: Array<{
 *       value: string | number,
 *       label: string,
 *       sublabel?: string,
 *       badge?: string,
 *       icon?: React.ReactNode,
 *       avatarInitial?: string,
 *       avatarColor?: string
 *     }>
 *   }>
 * - selected: Record<string, Array<string | number>>
 * - onChange: (newSelected: Record<string, Array<string | number>>) => void
 * - onClear?: () => void
 * - buttonText?: string
 * - align?: "left" | "right"
 * - className?: string
 * - buttonClassName?: string
 */
export default function FilterPopover({
  groups = [],
  selected = {},
  onChange,
  onClear,
  buttonText = "Filter",
  align = "left",
  className = "",
  buttonClassName = "",
  panelClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Calculate total number of active filter values
  const totalActive = Object.values(selected || {}).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : arr ? 1 : 0),
    0
  );

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggleOption = (groupId, optionValue) => {
    const currentList = Array.isArray(selected[groupId]) ? selected[groupId] : [];
    const exists = currentList.includes(optionValue);
    const updatedList = exists
      ? currentList.filter((v) => v !== optionValue)
      : [...currentList, optionValue];

    const updatedSelected = {
      ...selected,
      [groupId]: updatedList,
    };

    onChange?.(updatedSelected);
  };

  const handleClearAll = () => {
    if (onClear) {
      onClear();
    } else {
      const cleared = {};
      Object.keys(selected || {}).forEach((key) => {
        cleared[key] = [];
      });
      onChange?.(cleared);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Filter Trigger Button */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation shadow-sm cursor-pointer select-none ${
          totalActive > 0
            ? "bg-accent/20 border border-accent/50 text-accent-light hover:bg-accent/30"
            : "bg-surface-3 hover:bg-surface-2 border border-line text-ink hover:border-line/80"
        } ${isOpen ? "ring-2 ring-accent/40 border-accent" : ""} ${buttonClassName}`}
      >
        {/* Funnel Icon */}
        <Filter
          size={14}
          className={`shrink-0 transition-colors ${
            totalActive > 0 ? "text-accent-light" : "text-muted"
          }`}
        />

        <span>{buttonText}</span>

        {/* Active Badge */}
        {totalActive > 0 && (
          <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm animate-in zoom-in-75 duration-150">
            {totalActive}
          </span>
        )}

        {/* Chevron indicator */}
        <ChevronDown
          size={14}
          className={`text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent-light" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Filter options"
          className={`absolute mt-2 w-72 sm:w-80 rounded-xl bg-surface border border-line shadow-pop p-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-ink max-h-[80vh] flex flex-col ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {/* Scrollable Groups Area */}
          <div className="overflow-y-auto scrollbar-hide space-y-4 pr-1 max-h-[60vh]">
            {groups.length === 0 ? (
              <p className="text-xs text-muted text-center py-4 italic">No filter options available</p>
            ) : (
              groups.map((group, groupIdx) => {
                const groupSelected = Array.isArray(selected[group.id]) ? selected[group.id] : [];

                return (
                  <div key={group.id || groupIdx} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        {group.title}
                      </h4>
                      {groupSelected.length > 0 && (
                        <span className="text-[10px] text-accent-light font-semibold">
                          {groupSelected.length} selected
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {group.options?.length === 0 ? (
                        <p className="text-xs text-muted/60 px-2 py-1">No options</p>
                      ) : (
                        group.options.map((opt) => {
                          const isChecked = groupSelected.includes(opt.value);

                          return (
                            <label
                              key={String(opt.value)}
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm cursor-pointer select-none transition-colors touch-manipulation ${
                                isChecked
                                  ? "bg-accent/15 text-accent-light font-medium"
                                  : "text-ink hover:bg-surface-2"
                              }`}
                            >
                              {/* Custom Checkbox */}
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  isChecked
                                    ? "bg-accent border-accent text-white"
                                    : "border-line bg-surface-3 hover:border-accent/50"
                                }`}
                              >
                                {isChecked && (
                                  <Check size={11} strokeWidth={3} className="text-white shrink-0" />
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleOption(group.id, opt.value)}
                                className="sr-only"
                              />

                              {/* Avatar / Icon */}
                              {opt.avatarInitial && (
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                                  style={{ backgroundColor: opt.avatarColor || "#7C5CFF" }}
                                >
                                  {opt.avatarInitial}
                                </span>
                              )}
                              {opt.icon && <span className="shrink-0">{opt.icon}</span>}

                              {/* Label and Sublabel */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate leading-tight">{opt.label}</p>
                                {opt.sublabel && (
                                  <p className="text-[10px] text-muted truncate leading-tight mt-0.5">
                                    {opt.sublabel}
                                  </p>
                                )}
                              </div>

                              {/* Optional Badge */}
                              {opt.badge && (
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent-light font-semibold shrink-0 ml-1">
                                  {opt.badge}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with "Clear all" action when filters are active */}
          {totalActive > 0 && (
            <div className="pt-2.5 mt-2.5 border-t border-line/60 flex items-center justify-between">
              <span className="text-[11px] text-muted">
                {totalActive} active filter{totalActive === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-semibold text-accent-light hover:text-accent hover:underline px-2 py-1 rounded transition-colors touch-manipulation cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
