import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { X, Plus } from "lucide-react";
import api from "../api/axios.js";
import Card from "./Card.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function List({
  list,
  filters = { members: [], priority: [] },
  onAddCard,
  onOpenCard,
  onChanged,
}) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isFiltered =
    (filters.members && filters.members.length > 0) ||
    (filters.priority && filters.priority.length > 0);

  const visibleCards = list.cards.filter((card) => {
    if (!isFiltered) return true;
    if (filters.members && filters.members.length > 0) {
      const hasMember = card.assignees?.some((a) =>
        filters.members.includes(a._id || a)
      );
      if (!hasMember) return false;
    }
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(card.priority)) return false;
    }
    return true;
  });

  const submitCard = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddCard(list._id, title);
    setTitle("");
    setAdding(false);
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    if (listTitle.trim() && listTitle !== list.title) {
      await api.patch(`/lists/${list._id}`, { title: listTitle });
      onChanged();
    }
  };

  const handleConfirmDeleteList = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/lists/${list._id}`);
      toast.success(`List "${list.title}" deleted`, { title: "Deleted" });
      onChanged();
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete list");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-[82vw] max-w-[300px] sm:w-72 shrink-0 snap-center sm:snap-align-none bg-black/30 backdrop-blur-md border border-white/15 rounded-xl flex flex-col max-h-full shadow-card">
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        {editingTitle ? (
          <input
            autoFocus
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            className="text-base sm:text-sm font-semibold bg-white/15 text-white rounded-lg px-2.5 py-1 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        ) : (
          <h3
            onClick={() => setEditingTitle(true)}
            className="text-sm font-semibold text-white cursor-text tracking-tight flex items-center gap-1.5 truncate"
          >
            <span className="truncate">{list.title}</span>
            {isFiltered ? (
              <span
                className="text-accent-light bg-accent/20 border border-accent/30 font-semibold text-[11px] px-1.5 py-0.2 rounded-full shrink-0"
                title={`${visibleCards.length} of ${list.cards.length} cards match filters`}
              >
                {visibleCards.length}/{list.cards.length}
              </span>
            ) : (
              <span className="text-white/40 font-normal text-xs shrink-0">({list.cards.length})</span>
            )}
          </h3>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          title="Delete list"
          aria-label="Delete list"
          className="w-9 h-9 -mr-1.5 -my-1.5 flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation"
        >
          <X size={16} />
        </button>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDeleteList}
        title="Delete list"
        message={`Delete "${list.title}" and all its ${list.cards.length} cards? This action cannot be undone.`}
        confirmText="Delete list"
        isDestructive={true}
        loading={isDeleting}
      />

      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto scrollbar-hide px-2.5 space-y-2 pb-2 min-h-[16px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-accent/15" : ""
            }`}
          >
            {visibleCards.map((card, index) => (
              <Draggable key={card._id} draggableId={card._id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <Card card={card} dragging={dragSnapshot.isDragging} onClick={() => onOpenCard(card._id)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {isFiltered && list.cards.length > 0 && visibleCards.length === 0 && (
              <div className="py-4 text-center text-xs text-white/50 bg-white/5 rounded-lg border border-dashed border-white/10 my-1">
                No cards match filters
              </div>
            )}
          </div>
        )}
      </Droppable>

      <div className="px-2.5 pb-2.5 pt-1">
        {adding ? (
          <form onSubmit={submitCard} className="bg-surface/50 rounded-lg p-2 border border-line/40">
            <textarea
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitCard(e);
                }
              }}
              placeholder="Card title"
              rows={2}
              className="w-full text-base sm:text-sm rounded-lg bg-surface-3 border border-line text-ink placeholder:text-muted/60 px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                className="text-xs sm:text-sm bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-3.5 py-1.5 transition-colors touch-manipulation"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-xs sm:text-sm text-white/60 hover:text-white px-2.5 py-1.5 touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full text-left text-xs sm:text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-colors touch-manipulation flex items-center gap-1.5"
          >
            <Plus size={15} className="shrink-0" />
            <span>Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
}
