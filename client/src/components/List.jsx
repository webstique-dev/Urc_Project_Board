import { useState, useMemo, memo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { X, Plus, Loader2, GripVertical } from "lucide-react";
import api from "../api/axios.js";
import Card from "./Card.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cardMatchesFilter } from "../utils/filter.js";

function List({
  list,
  boardMembers = [],
  boardLabels = [],
  filters = { members: [], priority: [], dueDate: [], labels: [] },
  onAddCard,
  onOpenCard,
  onChanged,
  onToggleComplete,
  onToggleAssignee,
  onRemoveLabel,
  onToggleLabel,
  dragHandleProps,
  isDragging = false,
}) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
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
    e?.preventDefault();
    if (!title.trim() || isSubmittingCard) return;
    setIsSubmittingCard(true);
    try {
      await onAddCard(list._id, title.trim());
      setTitle("");
      setAdding(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create card");
    } finally {
      setIsSubmittingCard(false);
    }
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
    if (onToggleComplete) {
      return onToggleComplete(targetCard);
    }
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
    <div
      className={`w-[82vw] max-w-[300px] sm:w-72 shrink-0 bg-surface-2 border rounded-xl flex flex-col max-h-full transition-all duration-150 ${
        isDragging
          ? "border-accent/60 shadow-2xl ring-2 ring-accent/30 rotate-[0.8deg] opacity-95 bg-surface-2/95"
          : "border-line shadow-sm"
      }`}
    >
      <div
        {...dragHandleProps}
        className="flex items-center justify-between px-3 pt-3 pb-2 cursor-grab active:cursor-grabbing select-none group/header"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          <span
            className="text-muted/40 group-hover/header:text-muted/80 transition-colors p-0.5 -ml-1 cursor-grab"
            title="Drag to reorder column"
          >
            <GripVertical size={15} />
          </span>
          {editingTitle ? (
            <input
              autoFocus
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="text-base sm:text-sm font-semibold bg-white border border-line text-ink rounded-lg px-2.5 py-1 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-sm cursor-text"
            />
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
              className="text-sm font-semibold text-ink cursor-text tracking-tight flex items-center gap-1.5 truncate"
              title="Click to rename list"
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
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(true);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          title="Delete list"
          aria-label="Delete list"
          className="w-7 h-7 -mr-0.5 flex items-center justify-center text-muted hover:text-rose-600 hover:bg-surface-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer shrink-0"
        >
          <X size={15} />
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

      <Droppable droppableId={list._id} type="card">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto scrollbar-hide px-2.5 space-y-2 pb-2 min-h-[72px] rounded-lg transition-colors duration-150 ${
              snapshot.isDraggingOver ? "bg-accent/15 ring-2 ring-accent/30 ring-inset" : "bg-transparent"
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
                      boardMembers={boardMembers}
                      boardLabels={boardLabels}
                      onToggleAssignee={onToggleAssignee}
                      onRemoveLabel={onRemoveLabel}
                      onToggleLabel={onToggleLabel}
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

            {!isFiltered && list.cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="py-6 text-center text-xs text-muted/50 border border-dashed border-line/70 rounded-lg my-1 select-none">
                Drop cards here
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
                disabled={isSubmittingCard || !title.trim()}
                className={`text-xs sm:text-sm bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-3.5 py-1.5 transition-colors touch-manipulation flex items-center gap-1.5 ${
                  isSubmittingCard || !title.trim() ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {isSubmittingCard && <Loader2 size={12} className="animate-spin" />}
                <span>{isSubmittingCard ? "Adding…" : "Add card"}</span>
              </button>
              <button
                type="button"
                disabled={isSubmittingCard}
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
