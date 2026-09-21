import { memo } from "react";
import { Check, Calendar, Paperclip, CheckSquare, MessageSquare } from "lucide-react";

const priorityDot = { low: "bg-slate-300", medium: "bg-amber-400", high: "bg-rose-500" };

function Card({ card, dragging, onClick, onToggleComplete }) {
  const checklists = Array.isArray(card.checklists) && card.checklists.length > 0
    ? card.checklists
    : (Array.isArray(card.checklist) && card.checklist.length > 0
      ? [{ title: card.checklistTitle || "Checklist", items: card.checklist }]
      : []);
  const allItems = checklists.flatMap((cl) => cl.items || []);
  const checklistDone = allItems.filter((c) => c.done).length;
  const checklistTotal = allItems.length;
  const attachmentsCount = card.attachments?.length || 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleComplete) {
      onToggleComplete(card);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-lg border border-line px-3 py-2.5 cursor-pointer hover:border-accent/40 hover:shadow-md active:bg-surface-2 transition-all touch-manipulation group/card relative ${
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

        {card.assignees?.length > 0 && (
          <div className="flex -space-x-1.5 shrink-0 ml-auto">
            {card.assignees.slice(0, 3).map((u) => (
              <span
                key={u._id}
                title={u.name}
                className="w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center text-[9px] text-white font-medium shadow-sm"
                style={{ backgroundColor: u.avatarColor || "#B45309" }}
              >
                {u.name?.[0]?.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Card);
