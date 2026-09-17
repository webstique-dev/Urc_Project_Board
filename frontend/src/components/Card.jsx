const priorityDot = { low: "bg-slate-300", medium: "bg-amber-400", high: "bg-red-400" };

export default function Card({ card, dragging, onClick }) {
  const checklistDone = card.checklist?.filter((c) => c.done).length || 0;
  const checklistTotal = card.checklist?.length || 0;

  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-lg border border-line px-3 py-2.5 cursor-pointer hover:border-accent/50 transition-all ${
        dragging ? "shadow-pop rotate-1" : "shadow-card"
      }`}
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

      <p className="text-sm text-ink leading-snug">{card.title}</p>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2.5 text-muted">
          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[card.priority]}`} />
          {card.dueDate && (
            <span className="text-xs">
              {new Date(card.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="text-xs flex items-center gap-0.5">
              ☑ {checklistDone}/{checklistTotal}
            </span>
          )}
          {card.comments?.length > 0 && (
            <span className="text-xs flex items-center gap-0.5">
              💬 {card.comments.length}
            </span>
          )}
        </div>

        {card.assignees?.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.assignees.slice(0, 3).map((u) => (
              <span
                key={u._id}
                title={u.name}
                className="w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center text-[9px] text-white font-medium"
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
