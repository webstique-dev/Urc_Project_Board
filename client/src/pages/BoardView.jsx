import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import { Users, Plus, Tag, Loader2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { boardGradient } from "../utils/color.js";
import List from "../components/List.jsx";
import CardModal from "../components/CardModal.jsx";
import MembersPanel from "../components/MembersPanel.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";
import BoardSkeleton from "../components/ui/BoardSkeleton.jsx";
import { cardMatchesFilter } from "../utils/filter.js";

export default function BoardView() {
  const { id: boardId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [filters, setFilters] = useState({ members: [], priority: [], dueDate: [], labels: [] });

  const isManager =
    user?.role === "admin" ||
    board?.members?.some((m) => m.user._id === user?._id && m.role === "manager");

  const activeCardData = useMemo(() => {
    if (!activeCard) return null;
    for (const l of lists) {
      const found = (l.cards || []).find((c) => c._id === activeCard);
      if (found) return found;
    }
    return null;
  }, [activeCard, lists]);

  const loadBoard = useCallback(() => {
    api.get(`/boards/${boardId}`).then((res) => setBoard(res.data));
  }, [boardId]);

  const loadLists = useCallback(() => {
    api.get(`/lists/board/${boardId}`).then((res) => setLists(res.data));
  }, [boardId]);

  useEffect(() => {
    loadBoard();
    loadLists();
  }, [boardId, loadBoard, loadLists]);

  const { emitAction } = useSocket(boardId, {
    "lists:changed": loadLists,
    "card:changed": loadLists,
    "board:changed": loadBoard,
  });
  const broadcastRefresh = useCallback((event) => emitAction(event, { by: user?._id }), [emitAction, user?._id]);

  const addList = async (e) => {
    e?.preventDefault();
    if (!newListTitle.trim() || isSubmittingList) return;
    setIsSubmittingList(true);
    try {
      await api.post("/lists", { title: newListTitle.trim(), board: boardId });
      setNewListTitle("");
      setAddingList(false);
      loadLists();
      broadcastRefresh("lists:changed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create list");
    } finally {
      setIsSubmittingList(false);
    }
  };

  const addCard = useCallback(async (listId, title) => {
    await api.post("/cards", { title, board: boardId, list: listId });
    loadLists();
    broadcastRefresh("card:changed");
  }, [boardId, loadLists, broadcastRefresh]);

  const handleToggleComplete = useCallback(async (targetCard) => {
    const previousLists = lists;
    const nextCompleted = !targetCard.completed;

    // Optimistic local update
    setLists((currentLists) =>
      currentLists.map((l) => ({
        ...l,
        cards: (l.cards || []).map((c) =>
          c._id === targetCard._id ? { ...c, completed: nextCompleted } : c
        ),
      }))
    );

    try {
      await api.patch(`/cards/${targetCard._id}`, { completed: nextCompleted });
      if (nextCompleted) {
        toast.success(`Marked "${targetCard.title}" completed`, { title: "Completed" });
      }
      broadcastRefresh("card:changed");
    } catch (err) {
      // Rollback on failure
      setLists(previousLists);
      toast.error(err.response?.data?.message || "Failed to update card status. Reverted changes.");
    }
  }, [lists, toast, broadcastRefresh]);

  const handleToggleAssignee = useCallback(async (targetCard, userId) => {
    const previousLists = lists;
    const currentAssignees = targetCard.assignees || [];
    const isAlreadyAssigned = currentAssignees.some(
      (a) => (a._id ? a._id.toString() : String(a)) === String(userId)
    );

    let nextAssignees;
    if (isAlreadyAssigned) {
      nextAssignees = currentAssignees.filter(
        (a) => (a._id ? a._id.toString() : String(a)) !== String(userId)
      );
    } else {
      const memberObj = board?.members?.find(
        (m) => (m.user?._id ? m.user._id.toString() : String(m.user)) === String(userId)
      );
      const userPayload = memberObj?.user || { _id: userId, name: "Member" };
      nextAssignees = [...currentAssignees, userPayload];
    }

    const nextAssigneeIds = nextAssignees.map((a) => (a._id ? a._id : a));

    // Optimistic local update
    setLists((currentLists) =>
      currentLists.map((l) => ({
        ...l,
        cards: (l.cards || []).map((c) =>
          c._id === targetCard._id ? { ...c, assignees: nextAssignees } : c
        ),
      }))
    );

    try {
      await api.patch(`/cards/${targetCard._id}`, { assignees: nextAssigneeIds });
      broadcastRefresh("card:changed");
    } catch (err) {
      // Rollback on failure
      setLists(previousLists);
      toast.error(err.response?.data?.message || "Failed to update card members. Reverted changes.");
    }
  }, [lists, board?.members, toast, broadcastRefresh]);

  const isFiltered =
    (filters.members && filters.members.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    (filters.dueDate && filters.dueDate.length > 0) ||
    (filters.labels && filters.labels.length > 0);

  const totalCardsCount = useMemo(() => lists.reduce((sum, l) => sum + (l.cards?.length || 0), 0), [lists]);
  const totalMatchingCardsCount = useMemo(() => lists.reduce((sum, l) => {
    const matching = l.cards?.filter((c) => cardMatchesFilter(c, filters)).length || 0;
    return sum + matching;
  }, 0), [lists, filters]);

  const uniqueLabels = useMemo(() => {
    const set = new Set();
    lists.forEach((l) => {
      (l.cards || []).forEach((c) => {
        (c.labels || []).forEach((lbl) => {
          if (lbl && lbl.trim()) set.add(lbl.trim());
        });
      });
    });
    ["Design", "Frontend", "Backend", "Bug", "Feature", "Testing"].forEach((lbl) => set.add(lbl));
    return Array.from(set);
  }, [lists]);

  const filterGroups = useMemo(() => [
    {
      id: "labels",
      title: "Labels",
      options: [
        ...uniqueLabels.map((lbl) => {
          const count = lists.reduce(
            (sum, l) =>
              sum +
              (l.cards?.filter((c) => (c.labels || []).includes(lbl)).length || 0),
            0
          );
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
      id: "members",
      title: "Members",
      options: (board?.members || []).map((m) => ({
        value: m.user._id,
        label: m.user.name,
        badge: m.role === "manager" ? "Manager" : undefined,
        avatarInitial: m.user.name?.[0]?.toUpperCase(),
        avatarColor: m.user.avatarColor || "#0C66E4",
      })),
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
  ], [board?.members, lists, uniqueLabels]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newLists = lists.map((l) => ({ ...l, cards: [...l.cards] }));
    const src = newLists.find((l) => l._id === source.droppableId);
    const dst = newLists.find((l) => l._id === destination.droppableId);
    if (!src || !dst) return;

    const realSourceIndex = src.cards.findIndex((c) => c._id === draggableId);
    if (realSourceIndex === -1) return;
    const [movedCard] = src.cards.splice(realSourceIndex, 1);

    let realDestinationIndex;
    if (!isFiltered) {
      realDestinationIndex = destination.index;
    } else {
      const dstVisibleCards = dst.cards.filter((c) => cardMatchesFilter(c, filters));
      if (dstVisibleCards.length === 0) {
        realDestinationIndex = dst.cards.length;
      } else if (destination.index >= dstVisibleCards.length) {
        const lastVisible = dstVisibleCards[dstVisibleCards.length - 1];
        realDestinationIndex = dst.cards.findIndex((c) => c._id === lastVisible._id) + 1;
      } else {
        const targetVisible = dstVisibleCards[destination.index];
        realDestinationIndex = dst.cards.findIndex((c) => c._id === targetVisible._id);
      }
    }

    dst.cards.splice(realDestinationIndex, 0, movedCard);
    setLists(newLists);

    await api.patch(`/cards/${draggableId}/move`, {
      list: destination.droppableId,
      order: realDestinationIndex,
    });
    broadcastRefresh("card:changed");
  };

  if (!board) {
    return <BoardSkeleton />;
  }

  return (
    <div
      className="board-canvas min-h-[calc(100vh-56px-56px)] flex flex-col"
      style={{ background: boardGradient(board.color) }}
    >
      {/* Responsive Board Header */}
      <div className="relative z-20 px-4 sm:px-6 py-3 sm:py-4 border-b border-line bg-surface/85 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight break-words">{board.title}</h1>
          {board.description && (
            <p className="text-xs sm:text-sm text-muted mt-0.5 break-words line-clamp-2">{board.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Filter Popover */}
          <FilterPopover
            groups={filterGroups}
            selected={filters}
            onChange={setFilters}
            onClear={() => setFilters({ members: [], priority: [], dueDate: [], labels: [] })}
            align="right"
            buttonClassName="bg-surface hover:bg-surface-2 text-ink border-line shadow-sm"
          />

          <div className="flex -space-x-1.5 sm:-space-x-2">
            {board.members?.slice(0, 6).map((m) => (
              <span
                key={m.user._id}
                title={m.user.name}
                className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] text-white font-semibold shadow-sm"
                style={{ backgroundColor: m.user.avatarColor || "#0C66E4" }}
              >
                {m.user.name?.[0]?.toUpperCase()}
              </span>
            ))}
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowMembers(true)}
              className="btn-press text-xs sm:text-sm font-medium text-ink bg-surface hover:bg-surface-2 border border-line shadow-sm rounded-lg px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation flex items-center gap-1.5 cursor-pointer"
            >
              <Users size={14} className="shrink-0 text-muted" />
              <span>Manage team</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter notice if all cards on the board are hidden */}
      {isFiltered && totalCardsCount > 0 && totalMatchingCardsCount === 0 && (
        <div className="px-4 sm:px-6 pt-3">
          <div className="bg-surface border border-line rounded-xl px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm text-ink shadow-sm">
            <span>No cards on this board match your active filters.</span>
            <button
              type="button"
              onClick={() => setFilters({ members: [], priority: [], dueDate: [], labels: [] })}
              className="text-accent font-semibold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Responsive Drag and Drop Board Canvas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="flex-1 overflow-x-auto scrollbar-hide px-4 sm:px-6 py-4 sm:py-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-4 h-full items-start pb-4">
            {lists.map((list) => (
              <List
                key={list._id}
                list={list}
                boardMembers={board.members || []}
                filters={filters}
                onAddCard={addCard}
                onOpenCard={setActiveCard}
                onToggleComplete={handleToggleComplete}
                onToggleAssignee={handleToggleAssignee}
                onChanged={() => {
                  loadLists();
                  broadcastRefresh("lists:changed");
                }}
              />
            ))}

            <div className="w-[82vw] max-w-[300px] sm:w-72 shrink-0">
              {addingList ? (
                <form onSubmit={addList} className="bg-surface border border-line rounded-xl p-3 shadow-pop">
                  <input
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onBlur={() => !newListTitle && setAddingList(false)}
                    placeholder="List name"
                    className="w-full text-base sm:text-sm rounded-lg bg-surface-2 border border-line text-ink placeholder:text-muted/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="submit"
                      disabled={isSubmittingList || !newListTitle.trim()}
                      className={`text-xs sm:text-sm bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-3.5 py-1.5 transition-colors touch-manipulation flex items-center gap-1.5 ${
                        isSubmittingList || !newListTitle.trim() ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      {isSubmittingList && <Loader2 size={12} className="animate-spin" />}
                      <span>{isSubmittingList ? "Adding…" : "Add list"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingList}
                      onClick={() => setAddingList(false)}
                      className="text-xs sm:text-sm text-muted hover:text-ink px-2.5 py-1.5 touch-manipulation cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingList(true)}
                  className="w-full text-left text-xs sm:text-sm font-medium text-muted hover:text-ink hover:bg-surface/90 bg-surface/60 rounded-xl px-3.5 py-2.5 sm:py-3 border border-dashed border-line transition-all touch-manipulation flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={16} className="shrink-0" />
                  <span>Add another list</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>

      {activeCard && (
        <CardModal
          cardId={activeCard}
          initialCard={activeCardData}
          boardMembers={board.members}
          onClose={() => setActiveCard(null)}
          onChanged={() => {
            loadLists();
            broadcastRefresh("card:changed");
          }}
        />
      )}

      {showMembers && (
        <MembersPanel
          board={board}
          onClose={() => setShowMembers(false)}
          onChanged={(updated) => {
            setBoard(updated);
            broadcastRefresh("board:changed");
          }}
        />
      )}
    </div>
  );
}
