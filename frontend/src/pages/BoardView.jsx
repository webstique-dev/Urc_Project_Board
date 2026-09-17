import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { boardGradient } from "../utils/color.js";
import List from "../components/List.jsx";
import CardModal from "../components/CardModal.jsx";
import MembersPanel from "../components/MembersPanel.jsx";

export default function BoardView() {
  const { id: boardId } = useParams();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);

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

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newLists = lists.map((l) => ({ ...l, cards: [...l.cards] }));
    const src = newLists.find((l) => l._id === source.droppableId);
    const dst = newLists.find((l) => l._id === destination.droppableId);
    const [movedCard] = src.cards.splice(source.index, 1);
    dst.cards.splice(destination.index, 0, movedCard);
    setLists(newLists);

    await api.patch(`/cards/${draggableId}/move`, {
      list: destination.droppableId,
      order: destination.index,
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
      <div className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{board.title}</h1>
          {board.description && <p className="text-sm text-white/60">{board.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {board.members?.slice(0, 6).map((m) => (
              <span
                key={m.user._id}
                title={m.user.name}
                className="w-7 h-7 rounded-full border-2 border-black/20 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
              >
                {m.user.name?.[0]?.toUpperCase()}
              </span>
            ))}
          </div>
          {isManager && (
            <button
              onClick={() => setShowMembers(true)}
              className="text-sm text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              Manage team
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto px-6 py-5">
          <div className="flex gap-4 h-full items-start">
            {lists.map((list) => (
              <List
                key={list._id}
                list={list}
                onAddCard={addCard}
                onOpenCard={setActiveCard}
                onChanged={() => {
                  loadLists();
                  broadcastRefresh("lists:changed");
                }}
              />
            ))}

            <div className="w-72 shrink-0">
              {addingList ? (
                <form onSubmit={addList} className="bg-black/30 backdrop-blur border border-white/10 rounded-xl p-3">
                  <input
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onBlur={() => !newListTitle && setAddingList(false)}
                    placeholder="List name"
                    className="w-full text-sm rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <div className="flex gap-2 mt-2">
                    <button className="text-sm bg-accent hover:bg-accent-dark text-white rounded-lg px-3 py-1.5 transition-colors">
                      Add list
                    </button>
                    <button type="button" onClick={() => setAddingList(false)} className="text-sm text-white/60 px-2">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingList(true)}
                  className="w-full text-left text-sm text-white/70 hover:bg-white/10 rounded-xl px-3 py-2.5 border border-dashed border-white/20 transition-colors"
                >
                  + Add another list
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
