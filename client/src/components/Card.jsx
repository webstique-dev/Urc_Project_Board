import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Check, Calendar, Paperclip, CheckSquare, MessageSquare, UserPlus, Search, X, Users } from "lucide-react";

const priorityDot = { low: "bg-slate-300", medium: "bg-amber-400", high: "bg-rose-500" };

function Card({
  card,
  dragging,
  onClick,
  onToggleComplete,
  boardMembers = [],
  onToggleAssignee,
  canManageMembers = true,
}) {
  const [showMemberPopover, setShowMemberPopover] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 260, maxH: 320, placement: "bottom" });

  const checklists = Array.isArray(card.checklists) && card.checklists.length > 0
    ? card.checklists
    : (Array.isArray(card.checklist) && card.checklist.length > 0
      ? [{ title: card.checklistTitle || "Checklist", items: card.checklist }]
      : []);
  const allItems = checklists.flatMap((cl) => cl.items || []);
  const checklistDone = allItems.filter((c) => c.done).length;
  const checklistTotal = allItems.length;
  const attachmentsCount = card.attachments?.length || 0;

  // Position calculation with boundary clamping
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(270, Math.max(220, window.innerWidth - 24));

    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    let top = 0;
    let bottom = 0;
    let maxH = 320;
    let placement = "bottom";

    if (spaceBelow >= 180 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
      maxH = Math.min(340, Math.max(140, spaceBelow));
      placement = "bottom";
    } else {
      bottom = window.innerHeight - rect.top + 6;
      maxH = Math.min(340, Math.max(140, spaceAbove));
      placement = "top";
    }

    // Align right with button right edge, clamped to viewport margins
    let left = rect.right - popoverWidth;
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }

    setCoords({ top, bottom, left, width: popoverWidth, maxH, placement });
  }, []);

  useEffect(() => {
    if (showMemberPopover) {
      updatePosition();
      const handleReposition = () => updatePosition();
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);
      return () => {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      };
    }
  }, [showMemberPopover, updatePosition]);

  // Close member popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!showMemberPopover) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setShowMemberPopover(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setShowMemberPopover(false);
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
  }, [showMemberPopover]);

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleComplete) {
      onToggleComplete(card);
    }
  };

  const handleOpenMemberPopover = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setMemberSearch("");
    setShowMemberPopover((prev) => !prev);
  };

  const handleToggleMember = (e, userId) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleAssignee) {
      onToggleAssignee(card, userId);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return boardMembers;
    const q = memberSearch.toLowerCase();
    return boardMembers.filter(
      (m) =>
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q)
    );
  }, [boardMembers, memberSearch]);

  const assignedMemberIds = useMemo(() => {
    return (card.assignees || []).map((a) => (a._id ? a._id.toString() : String(a)));
  }, [card.assignees]);

  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-lg border border-line px-3 py-2.5 cursor-pointer hover:border-accent/40 hover:shadow-md active:scale-[0.985] active:border-accent/60 active:bg-surface-2 transition-all duration-100 touch-manipulation group group/card relative ${
        dragging ? "shadow-pop rotate-1 ring-2 ring-accent/40 card-dragging" : "shadow-card"
      } ${card.completed ? "opacity-85" : ""}`}
    >
      {card.labels?.length > 0 && (
        <div className="flex gap-1 mb-1.5 flex-wrap">
          {card.labels.map((label) => (
            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink font-semibold">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Quick Completion Circle */}
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(card.completed)}
          aria-label={card.completed ? "Mark card incomplete" : "Mark card complete"}
          title={card.completed ? "Mark incomplete" : "Mark complete"}
          onClick={handleToggle}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
            card.completed
              ? "bg-emerald-500 border-emerald-500 text-white opacity-100 shadow-xs"
              : "border-stone-300 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
          }`}
        >
          <Check
            size={12}
            strokeWidth={3}
            className={`transition-transform duration-150 ${
              card.completed
                ? "scale-100 text-white"
                : "scale-0 group-hover/card:scale-75 hover:!scale-100 text-emerald-600"
            }`}
          />
        </button>

        <p
          className={`text-sm font-medium leading-snug break-words flex-1 transition-colors ${
            card.completed ? "line-through text-muted" : "text-ink"
          }`}
        >
          {card.title}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
        <div className="flex items-center gap-2 text-muted flex-wrap">
          <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[card.priority] || priorityDot.low}`} />
          {card.dueDate && (
            <span className="text-xs whitespace-nowrap flex items-center gap-1">
              <Calendar size={13} className="shrink-0 text-muted" />
              <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            </span>
          )}
          {attachmentsCount > 0 && (
            <span className="text-xs flex items-center gap-1 whitespace-nowrap" title={`${attachmentsCount} attachment(s)`}>
              <Paperclip size={13} className="shrink-0 text-muted" />
              <span>{attachmentsCount}</span>
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="text-xs flex items-center gap-1 whitespace-nowrap">
              <CheckSquare size={13} className="shrink-0 text-muted" />
              <span>{checklistDone}/{checklistTotal}</span>
            </span>
          )}
          {card.comments?.length > 0 && (
            <span className="text-xs flex items-center gap-1 whitespace-nowrap">
              <MessageSquare size={13} className="shrink-0 text-muted" />
              <span>{card.comments.length}</span>
            </span>
          )}
        </div>

        {/* Member Management Controls on Card */}
        <div ref={triggerRef} className="flex items-center gap-1 shrink-0 ml-auto relative">
          {card.assignees?.length > 0 && (
            <div
              className="flex -space-x-1.5 cursor-pointer"
              title="Click to manage members"
              onClick={handleOpenMemberPopover}
            >
              {card.assignees.slice(0, 3).map((u) => (
                <span
                  key={u._id || u}
                  title={u.name || "Member"}
                  className="w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center text-[9px] text-white font-medium shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: u.avatarColor || "#B45309" }}
                >
                  {(u.name?.[0] || "M").toUpperCase()}
                </span>
              ))}
              {card.assignees.length > 3 && (
                <span className="w-5 h-5 rounded-full border-2 border-surface bg-stone-200 text-stone-700 flex items-center justify-center text-[8px] font-bold shadow-sm">
                  +{card.assignees.length - 3}
                </span>
              )}
            </div>
          )}

          {canManageMembers && (
            <button
              type="button"
              aria-label="Add or remove members"
              title="Add or remove members"
              onClick={handleOpenMemberPopover}
              className="w-5 h-5 rounded-full border border-dashed border-stone-300 hover:border-accent hover:bg-accent/10 text-muted hover:text-accent flex items-center justify-center transition-colors focus:outline-none touch-manipulation cursor-pointer"
            >
              <UserPlus size={10} />
            </button>
          )}

          {/* Portaled & Viewport-Clamped Member Selector Popover */}
          {showMemberPopover &&
            createPortal(
              <div
                ref={popoverRef}
                role="dialog"
                aria-label="Card Members"
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
                className="z-[9999] overflow-y-auto scrollbar-hide bg-surface border border-line rounded-xl shadow-pop p-2.5 animate-in fade-in-50 zoom-in-95"
              >
                <div className="flex items-center justify-between pb-2 border-b border-line/60 mb-2">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Users size={13} className="text-accent" />
                    <span>Card Members</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMemberPopover(false);
                    }}
                    className="text-muted hover:text-ink p-0.5 rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
                    aria-label="Close member selector"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Search input */}
                <div className="relative mb-2">
                  <Search size={12} className="absolute left-2 top-2 text-muted" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search project members…"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 text-xs bg-surface-2 border border-line rounded-lg text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Members List */}
                <div className="max-h-44 overflow-y-auto scrollbar-hide space-y-1">
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-muted/60 text-center py-2">
                      {boardMembers.length === 0 ? "No project members" : "No matching members"}
                    </p>
                  ) : (
                    filteredMembers.map((m) => {
                      const memberId = m.user?._id ? m.user._id.toString() : String(m.user);
                      const isAssigned = assignedMemberIds.includes(memberId);
                      return (
                        <button
                          key={memberId}
                          type="button"
                          onClick={(e) => handleToggleMember(e, memberId)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isAssigned
                              ? "bg-accent/15 text-accent font-medium"
                              : "text-ink hover:bg-surface-2"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-semibold shrink-0 shadow-sm"
                              style={{ backgroundColor: m.user?.avatarColor || "#0C66E4" }}
                            >
                              {(m.user?.name?.[0] || "U").toUpperCase()}
                            </span>
                            <span className="truncate">{m.user?.name || "User"}</span>
                          </div>
                          {isAssigned && <Check size={13} className="text-accent font-bold shrink-0 ml-1" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}

export default memo(Card);
