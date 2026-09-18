import { Check, Calendar, Paperclip, CheckSquare, MessageSquare } from "lucide-react";

const priorityDot = { low: "bg-slate-300", medium: "bg-amber-400", high: "bg-red-400" };

export default function Card({ card, dragging, onClick }) {
  const checklistDone = card.checklist?.filter((c) => c.done).length || 0;
  const checklistTotal = card.checklist?.length || 0;
  const attachmentsCount = card.attachments?.length || 0;

  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-lg border border-line px-3 py-2.5 cursor-pointer hover:border-accent/50 active:bg-surface-2 transition-all touch-manipulation ${
        dragging ? "shadow-pop rotate-1 ring-2 ring-accent/50" : "shadow-card"
      } ${card.completed ? "opacity-80" : ""}`}
    >
      {card.labels?.length > 0 && (
        <div className="flex gap-1 mb-1.5 flex-wrap">
          {card.labels.map((label) => (
            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent-light font-medium">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        {card.completed && (
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Check size={11} strokeWidth={3} />
          </span>
        )}
        <p
          className={`text-sm font-medium text-ink leading-snug break-words flex-1 ${
            card.completed ? "line-through text-muted" : ""
          }`}
        >
          {card.title}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
        <div className="flex items-center gap-2 text-muted flex-wrap">
          <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[card.priority]}`} />
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
                style={{ backgroundColor: u.avatarColor || "#7C5CFF" }}
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
