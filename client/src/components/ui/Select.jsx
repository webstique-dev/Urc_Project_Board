import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Reusable dark-themed Select / Dropdown component
 * Replaces native HTML <select> with styled, accessible dropdown popup.
 *
 * Option shape:
 * - string/number (e.g. "low")
 * - { value: any, label: string, sublabel?: string, badge?: string, icon?: ReactNode, avatarColor?: string, avatarInitial?: string }
 */
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = "Select an option…",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  id,
  "aria-label": ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);

  // Normalize options
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value,
        label: opt.label !== undefined ? opt.label : String(opt.value),
        sublabel: opt.sublabel || null,
        badge: opt.badge || null,
        icon: opt.icon || null,
        avatarColor: opt.avatarColor || null,
        avatarInitial: opt.avatarInitial || null,
        disabled: opt.disabled || false,
      };
    }
    return {
      value: opt,
      label: String(opt),
      sublabel: null,
      badge: null,
      icon: null,
      avatarColor: null,
      avatarInitial: null,
      disabled: false,
    };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

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

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = normalizedOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, normalizedOptions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const activeEl = listboxRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback(
    (optValue) => {
      onChange?.(optValue);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          const opt = normalizedOptions[highlightedIndex];
          if (!opt.disabled) {
            handleSelect(opt.value);
          }
        }
        break;
      }
      case "Escape":
      case "Tab": {
        setIsOpen(false);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 rounded-lg bg-surface-3 border border-line px-3 py-2 text-base sm:text-sm text-ink transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation hover:border-accent/40 ${
          isOpen ? "border-accent/60 ring-2 ring-accent/30" : ""
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate text-left flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.avatarInitial && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                  style={{ backgroundColor: selectedOption.avatarColor || "#7C5CFF" }}
                >
                  {selectedOption.avatarInitial}
                </span>
              )}
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate text-ink font-medium">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent-light font-semibold shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted/70 truncate">{placeholder}</span>
          )}
        </div>

        {/* Chevron icon */}
        <ChevronDown
          size={16}
          className={`text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent-light" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto scrollbar-hide rounded-xl bg-surface border border-line shadow-pop p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs sm:text-sm text-muted text-center italic">
              No options available
            </div>
          ) : (
            normalizedOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer select-none touch-manipulation ${
                    option.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : isSelected
                      ? "bg-accent/20 text-accent-light font-medium"
                      : isHighlighted
                      ? "bg-surface-2 text-ink"
                      : "text-ink hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {option.avatarInitial && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                        style={{ backgroundColor: option.avatarColor || "#7C5CFF" }}
                      >
                        {option.avatarInitial}
                      </span>
                    )}
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ink font-medium">{option.label}</p>
                      {option.sublabel && (
                        <p className="text-[11px] text-muted truncate">{option.sublabel}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent-light font-semibold">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={16} strokeWidth={2.5} className="text-accent-light shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export { Select as Dropdown };
