import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-ink mb-1">My tasks</h1>
      <p className="text-sm text-muted mb-8">Everything assigned to you, across every project</p>

      {cards.length === 0 && (
        <div className="text-center py-20 border border-dashed border-line rounded-xl text-muted">
          Nothing assigned to you right now.
        </div>
      )}

      <div className="space-y-2">
        {cards.map((card) => (
          <Link
            key={card._id}
            to={`/boards/${card.board._id}`}
            className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 hover:border-accent/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-ink">{card.title}</p>
              <p className="text-xs text-muted mt-0.5">
                {card.board.title} · {card.list.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {card.dueDate && (
                <span className="text-xs text-muted">
                  {new Date(card.dueDate).toLocaleDateString()}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[card.priority]}`}>
                {card.priority}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
