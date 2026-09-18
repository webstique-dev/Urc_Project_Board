import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import { Users, Plus } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { boardGradient } from "../utils/color.js";
import List from "../components/List.jsx";
import CardModal from "../components/CardModal.jsx";
import MembersPanel from "../components/MembersPanel.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";

const cardMatchesFilter = (card, f) => {
  if (!f) return true;
  if (f.members && f.members.length > 0) {
    const hasMember = card.assignees?.some((a) =>
      f.members.includes(a._id || a)
    );
    if (!hasMember) return false;
  }
  if (f.priority && f.priority.length > 0) {
    if (!f.priority.includes(card.priority)) return false;
  }
  return true;
};

export default function BoardView() {
  const { id: boardId } = useParams();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [filters, setFilters] = useState({ members: [], priority: [] });

  const isManager =
    user?.role === "admin" ||
    board?.members?.some((m) => m.user._id === user?._id && m.role === "manager");

  const loadLists = useCallback(() => {
    api.get(`/lists/board/${boardId}`).then((res) => setLists(res.data));
  }, [boardId]);

  useEffect(() => {
    api.get(`/boards/${boardId}`).then((res) => setBoard(res.data));
    loadLists();
  }, [boardId, loadLists]);

  const { emitAction } = useSocket(boardId, {
    "lists:changed": loadLists,
    "card:changed": loadLists,
  });
  const broadcastRefresh = (event) => emitAction(event, { by: user?._id });

  const addList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await api.post("/lists", { title: newListTitle, board: boardId });
    setNewListTitle("");
    setAddingList(false);
    loadLists();
    broadcastRefresh("lists:changed");
  };

  const addCard = async (listId, title) => {
    await api.post("/cards", { title, board: boardId, list: listId });
    loadLists();
    broadcastRefresh("card:changed");
  };

  const isFiltered =
    (filters.members && filters.members.length > 0) ||
    (filters.priority && filters.priority.length > 0);

  const totalCardsCount = lists.reduce((sum, l) => sum + (l.cards?.length || 0), 0);
  const totalMatchingCardsCount = lists.reduce((sum, l) => {
    const matching = l.cards?.filter((c) => cardMatchesFilter(c, filters)).length || 0;
    return sum + matching;
  }, 0);

  const filterGroups = [
    {
      id: "members",
      title: "Members",
      options: (board?.members || []).map((m) => ({
        value: m.user._id,
        label: m.user.name,
        badge: m.role === "manager" ? "Manager" : undefined,
        avatarInitial: m.user.name?.[0]?.toUpperCase(),
        avatarColor: m.user.avatarColor || "#7C5CFF",
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
          icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />,
        },
      ],
    },
  ];

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
    return <div className="h-[calc(100vh-56px-56px)] flex items-center justify-center text-muted">Loading…</div>;
  }

  return (
    <div
      className="board-canvas min-h-[calc(100vh-56px-56px)] flex flex-col"
      style={{ background: boardGradient(board.color) }}
    >
      {/* Responsive Board Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black/25 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words">{board.title}</h1>
          {board.description && (
            <p className="text-xs sm:text-sm text-white/70 mt-0.5 break-words line-clamp-2">{board.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Filter Popover */}
          <FilterPopover
            groups={filterGroups}
            selected={filters}
            onChange={setFilters}
            onClear={() => setFilters({ members: [], priority: [] })}
            align="right"
            buttonClassName="bg-white/10 hover:bg-white/15 text-white border-white/20"
          />

          <div className="flex -space-x-1.5 sm:-space-x-2">
            {board.members?.slice(0, 6).map((m) => (
              <span
                key={m.user._id}
                title={m.user.name}
                className="w-7 h-7 rounded-full border-2 border-surface/80 flex items-center justify-center text-[10px] text-white font-semibold shadow-sm"
                style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
              >
                {m.user.name?.[0]?.toUpperCase()}
              </span>
            ))}
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowMembers(true)}
              className="text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-lg px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation flex items-center gap-1.5"
            >
              <Users size={14} className="shrink-0" />
              <span>Manage team</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter notice if all cards on the board are hidden */}
      {isFiltered && totalCardsCount > 0 && totalMatchingCardsCount === 0 && (
        <div className="px-4 sm:px-6 pt-3">
          <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm text-white shadow-sm">
            <span>No cards on this board match your active filters.</span>
            <button
              type="button"
              onClick={() => setFilters({ members: [], priority: [] })}
              className="text-accent-light font-semibold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Responsive Drag and Drop Board Canvas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="flex-1 overflow-x-auto scrollbar-hide px-4 sm:px-6 py-4 sm:py-5 snap-x snap-mandatory sm:snap-none scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-4 h-full items-start pb-4">
            {lists.map((list) => (
              <List
                key={list._id}
                list={list}
                filters={filters}
                onAddCard={addCard}
                onOpenCard={setActiveCard}
                onChanged={() => {
                  loadLists();
                  broadcastRefresh("lists:changed");
                }}
              />
            ))}

            <div className="w-[82vw] max-w-[300px] sm:w-72 shrink-0 snap-center sm:snap-align-none">
              {addingList ? (
                <form onSubmit={addList} className="bg-black/35 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-pop">
                  <input
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onBlur={() => !newListTitle && setAddingList(false)}
                    placeholder="List name"
                    className="w-full text-base sm:text-sm rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-white/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="submit"
                      className="text-xs sm:text-sm bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-3.5 py-1.5 transition-colors touch-manipulation"
                    >
                      Add list
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingList(false)}
                      className="text-xs sm:text-sm text-white/60 hover:text-white px-2.5 py-1.5 touch-manipulation"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingList(true)}
                  className="w-full text-left text-xs sm:text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 active:bg-white/20 rounded-xl px-3.5 py-2.5 sm:py-3 border border-dashed border-white/25 transition-all touch-manipulation flex items-center gap-1.5 shadow-sm"
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
          onChanged={(updated) => setBoard(updated)}
        />
      )}
    </div>
  );
}
