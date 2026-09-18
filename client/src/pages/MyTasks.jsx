import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Calendar, CheckSquare } from "lucide-react";
import api from "../api/axios.js";

const priorityColor = {
  low: "bg-white/10 text-muted",
  medium: "bg-amber-400/15 text-amber-300",
  high: "bg-red-400/15 text-red-300",
};

export default function MyTasks() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    api.get("/cards/mine").then((res) => setCards(res.data));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mb-1">My tasks</h1>
      <p className="text-xs sm:text-sm text-muted mb-6 sm:mb-8">Everything assigned to you, across every project</p>

      {cards.length === 0 && (
        <div className="text-center py-16 sm:py-20 border border-dashed border-line rounded-xl sm:rounded-2xl bg-surface/30 px-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center text-muted mx-auto mb-3">
            <CheckSquare size={24} className="text-muted shrink-0" />
          </div>
          <p className="text-sm font-medium text-ink">Nothing assigned to you right now</p>
          <p className="text-xs text-muted mt-1">When tasks are assigned to you on any board, they'll appear here.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {cards.map((card) => (
          <Link
            key={card._id}
            to={`/boards/${card.board._id}`}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-line bg-surface p-3.5 sm:p-4 hover:border-accent/50 active:scale-[0.99] transition-all shadow-card group ${
              card.completed ? "opacity-75" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {card.completed && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check size={11} strokeWidth={3} className="text-emerald-400 shrink-0" />
                  </span>
                )}
                <p
                  className={`text-sm font-semibold text-ink group-hover:text-accent-light transition-colors break-words ${
                    card.completed ? "line-through text-muted" : ""
                  }`}
                >
                  {card.title}
                </p>
              </div>
              <p className="text-xs text-muted mt-1 truncate">
                {card.board.title} · {card.list.title}
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              {card.dueDate && (
                <span className="text-xs text-muted whitespace-nowrap flex items-center gap-1">
                  <Calendar size={13} className="shrink-0 text-muted" />
                  <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </span>
              )}
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] ${priorityColor[card.priority]}`}>
                {card.priority}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
