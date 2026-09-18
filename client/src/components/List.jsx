import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../api/axios.js";
import Card from "./Card.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function List({ list, onAddCard, onOpenCard, onChanged }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <div className="w-72 shrink-0 bg-black/25 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col max-h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        {editingTitle ? (
          <input
            autoFocus
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            className="text-sm font-medium bg-white/10 text-white rounded px-2 py-1 w-full mr-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        ) : (
          <h3
            onClick={() => setEditingTitle(true)}
            className="text-sm font-medium text-white cursor-text"
          >
            {list.title}
            <span className="text-white/40 font-normal ml-1.5">{list.cards.length}</span>
          </h3>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          title="Delete list"
          aria-label="Delete list"
          className="text-white/40 hover:text-red-400 text-xs p-1 transition-colors"
        >
          ✕
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
            className={`flex-1 overflow-y-auto px-2 space-y-2 pb-2 min-h-[8px] rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-accent/10" : ""
            }`}
          >
            {list.cards.map((card, index) => (
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
          </div>
        )}
      </Droppable>

      <div className="px-2 pb-2">
        {adding ? (
          <form onSubmit={submitCard}>
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
              className="w-full text-sm rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <div className="flex gap-2 mt-1.5">
              <button className="text-sm bg-accent hover:bg-accent-dark text-white rounded-lg px-3 py-1 transition-colors">
                Add
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-white/60">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left text-sm text-white/60 hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}
