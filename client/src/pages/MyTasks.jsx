import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, Calendar, CheckSquare, Filter, Tag } from "lucide-react";
import api from "../api/axios.js";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cardMatchesFilter } from "../utils/filter.js";

const priorityColor = {
  low: "bg-surface-2 text-ink border border-line",
  medium: "bg-amber-50 text-amber-800 border border-amber-200",
  high: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function MyTasks() {
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ priority: [], dueDate: [], labels: [] });

  useEffect(() => {
    api.get("/cards/mine")
      .then((res) => setCards(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleTask = async (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    const nextCompleted = !card.completed;
    try {
      await api.patch(`/cards/${card._id}`, { completed: nextCompleted });
      if (nextCompleted) {
        toast.success(`Marked "${card.title}" complete`, { title: "Completed" });
      }
      setCards((prev) =>
        prev.map((c) => (c._id === card._id ? { ...c, completed: nextCompleted } : c))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update card status");
    }
  };

  const isFiltered =
    (filters.priority && filters.priority.length > 0) ||
    (filters.dueDate && filters.dueDate.length > 0) ||
    (filters.labels && filters.labels.length > 0);

  const filteredCards = useMemo(() => {
    if (!isFiltered) return cards;
    return cards.filter((c) => cardMatchesFilter(c, filters));
  }, [cards, isFiltered, filters]);

  const uniqueLabels = useMemo(() => {
    const set = new Set();
    cards.forEach((c) => {
      (c.labels || []).forEach((lbl) => {
        if (lbl && lbl.trim()) set.add(lbl.trim());
      });
    });
    ["Design", "Frontend", "Backend", "Bug", "Feature", "Testing"].forEach((lbl) => set.add(lbl));
    return Array.from(set);
  }, [cards]);

  const filterGroups = useMemo(() => [
    {
      id: "labels",
      title: "Labels",
      options: [
        ...uniqueLabels.map((lbl) => {
          const count = cards.filter((c) => (c.labels || []).includes(lbl)).length;
          return {
            value: lbl,
            label: lbl,
            icon: <Tag size={12} className="text-accent inline-block" />,
            badge: count > 0 ? String(count) : undefined,
          };
        }),
        {
          value: "no_label",
          label: "No label",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />,
        },
      ],
    },
    {
      id: "priority",
      title: "Priority",
      options: [
        {
          value: "low",
          label: "Low",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />,
        },
        {
          value: "medium",
          label: "Medium",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />,
        },
        {
          value: "high",
          label: "High",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />,
        },
      ],
    },
    {
      id: "dueDate",
      title: "Due Date",
      options: [
        {
          value: "overdue",
          label: "Overdue",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />,
        },
        {
          value: "today",
          label: "Due today",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />,
        },
        {
          value: "tomorrow",
          label: "Due tomorrow",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />,
        },
        {
          value: "this_week",
          label: "Due in next 7 days",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />,
        },
        {
          value: "has_due_date",
          label: "Has due date",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />,
        },
        {
          value: "no_due_date",
          label: "No due date",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />,
        },
      ],
    },
  ], [cards, uniqueLabels]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">My tasks</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">Everything assigned to you, across every project</p>
        </div>

        {cards.length > 0 && (
          <FilterPopover
            groups={filterGroups}
            selected={filters}
            onChange={setFilters}
            onClear={() => setFilters({ priority: [], dueDate: [], labels: [] })}
            align="right"
          />
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-surface p-3.5 sm:p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 sm:py-20 border border-dashed border-line rounded-xl sm:rounded-2xl bg-surface p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-muted mx-auto mb-3">
            <CheckSquare size={24} className="text-muted shrink-0" />
          </div>
          <p className="text-sm font-semibold text-ink">Nothing assigned to you right now</p>
          <p className="text-xs text-muted mt-1">When tasks are assigned to you on any board, they'll appear here.</p>
        </div>
      ) : isFiltered && filteredCards.length === 0 ? (
        <div className="text-center py-16 sm:py-20 border border-dashed border-line rounded-xl sm:rounded-2xl bg-surface p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-muted mx-auto mb-3">
            <Filter size={24} className="text-muted shrink-0" />
          </div>
          <p className="text-sm font-semibold text-ink">No tasks match your filters</p>
          <p className="text-xs text-muted mt-1">None of your assigned tasks match the selected labels, priority, or due date.</p>
          <button
            type="button"
            onClick={() => setFilters({ priority: [], dueDate: [], labels: [] })}
            className="mt-4 bg-accent hover:bg-accent-dark text-white text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCards.map((card) => (
            <Link
              key={card._id}
              to={`/boards/${card.board._id}`}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-line bg-surface p-3.5 sm:p-4 hover:border-accent/40 hover:shadow-md active:scale-[0.99] transition-all shadow-card group/card ${
                card.completed ? "opacity-80" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={Boolean(card.completed)}
                    aria-label={card.completed ? "Mark card incomplete" : "Mark card complete"}
                    title={card.completed ? "Mark incomplete" : "Mark complete"}
                    onClick={(e) => handleToggleTask(e, card)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
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
                    className={`text-sm font-semibold transition-colors break-words ${
                      card.completed ? "line-through text-muted" : "text-ink group-hover/card:text-accent"
                    }`}
                  >
                    {card.title}
                  </p>
                </div>
                <p className="text-xs text-muted mt-1 truncate pl-7.5 sm:pl-7.5">
                  {card.board?.title || "Board"} · {card.list?.title || "List"}
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                {card.dueDate && (
                  <span className="text-xs text-muted whitespace-nowrap flex items-center gap-1">
                    <Calendar size={13} className="shrink-0 text-muted" />
                    <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </span>
                )}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] ${priorityColor[card.priority] || priorityColor.low}`}>
                  {card.priority}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

