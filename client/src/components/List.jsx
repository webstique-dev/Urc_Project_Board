import { useState, useMemo, memo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { X, Plus } from "lucide-react";
import api from "../api/axios.js";
import Card from "./Card.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cardMatchesFilter } from "../utils/filter.js";

function List({
  list,
  filters = { members: [], priority: [], dueDate: [], labels: [] },
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
    (filters.priority && filters.priority.length > 0) ||
    (filters.dueDate && filters.dueDate.length > 0) ||
    (filters.labels && filters.labels.length > 0);

  const visibleCards = useMemo(() => {
    if (!isFiltered) return list.cards;
    return list.cards.filter((card) => cardMatchesFilter(card, filters));
  }, [list.cards, isFiltered, filters]);

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

  const handleToggleComplete = async (targetCard) => {
    const nextCompleted = !targetCard.completed;
    try {
      await api.patch(`/cards/${targetCard._id}`, { completed: nextCompleted });
      if (nextCompleted) {
        toast.success(`Marked "${targetCard.title}" completed`, { title: "Completed" });
      }
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update card status");
    }
  };

  return (
    <div className="w-[82vw] max-w-[300px] sm:w-72 shrink-0 bg-surface-2 border border-line rounded-xl flex flex-col max-h-full shadow-sm">
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        {editingTitle ? (
          <input
            autoFocus
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            className="text-base sm:text-sm font-semibold bg-white border border-line text-ink rounded-lg px-2.5 py-1 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-sm"
          />
        ) : (
          <h3
            onClick={() => setEditingTitle(true)}
            className="text-sm font-semibold text-ink cursor-text tracking-tight flex items-center gap-1.5 truncate"
          >
            <span className="truncate">{list.title}</span>
            {isFiltered ? (
              <span
                className="text-ink bg-surface-3 border border-line font-semibold text-[11px] px-1.5 py-0.2 rounded-full shrink-0"
                title={`${visibleCards.length} of ${list.cards.length} cards match filters`}
              >
                {visibleCards.length}/{list.cards.length}
              </span>
            ) : (
              <span className="text-muted font-normal text-xs shrink-0">({list.cards.length})</span>
            )}
          </h3>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          title="Delete list"
          aria-label="Delete list"
          className="w-8 h-8 -mr-1 -my-1 flex items-center justify-center text-muted hover:text-rose-600 hover:bg-surface-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer"
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
              snapshot.isDraggingOver ? "bg-accent/10" : ""
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
                    <Card
                      card={card}
                      dragging={dragSnapshot.isDragging}
                      onClick={() => onOpenCard(card._id)}
                      onToggleComplete={handleToggleComplete}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {isFiltered && list.cards.length > 0 && visibleCards.length === 0 && (
              <div className="py-4 text-center text-xs text-muted bg-white/60 rounded-lg border border-dashed border-line my-1">
                No cards match filters
              </div>
            )}
          </div>
        )}
      </Droppable>

      <div className="px-2.5 pb-2.5 pt-1">
        {adding ? (
          <form onSubmit={submitCard} className="bg-white rounded-lg p-2 border border-line shadow-sm">
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
              className="w-full text-base sm:text-sm rounded-lg bg-surface-2 border border-line text-ink placeholder:text-muted/60 px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                className="text-xs sm:text-sm bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-3.5 py-1.5 transition-colors touch-manipulation cursor-pointer"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-xs sm:text-sm text-muted hover:text-ink px-2.5 py-1.5 touch-manipulation cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full text-left text-xs sm:text-sm font-medium text-muted hover:text-ink hover:bg-surface-3 rounded-lg px-3 py-2 transition-colors touch-manipulation flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} className="shrink-0" />
            <span>Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(List);
