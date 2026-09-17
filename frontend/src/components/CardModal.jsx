import { useEffect, useState } from "react";
import api from "../api/axios.js";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function CardModal({ cardId, boardMembers, onClose, onChanged }) {
  const toast = useToast();
  const [card, setCard] = useState(null);
  const [description, setDescription] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [comment, setComment] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => api.get(`/cards/${cardId}`).then((res) => {
    setCard(res.data);
    setDescription(res.data.description || "");
  });

  useEffect(() => { load(); }, [cardId]);

  const save = async (patch) => {
    const res = await api.patch(`/cards/${cardId}`, patch);
    setCard(res.data);
    onChanged();
  };

  const toggleAssignee = (userId) => {
    const current = card.assignees.map((a) => a._id);
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    save({ assignees: next });
  };

  const toggleChecklistItem = (index) => {
    const next = [...card.checklist];
    next[index] = { ...next[index], done: !next[index].done };
    save({ checklist: next });
  };

  const addChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    save({ checklist: [...card.checklist, { text: newChecklistItem, done: false }] });
    setNewChecklistItem("");
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const res = await api.post(`/cards/${cardId}/comments`, { text: comment });
    setCard(res.data);
    setComment("");
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/cards/${cardId}`);
      toast.success("Card deleted", { title: "Deleted" });
      onChanged();
      setShowDeleteModal(false);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete card");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!card) return null;

  const fieldClass =
    "w-full text-sm rounded-lg bg-surface-3 border border-line px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 z-50" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-xl w-full max-w-2xl mx-4 p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <input
            value={card.title}
            onChange={(e) => setCard({ ...card, title: e.target.value })}
            onBlur={() => save({ title: card.title })}
            className="text-lg font-semibold text-ink w-full mr-4 -ml-1 px-1 rounded bg-transparent hover:bg-white/5 focus:bg-white/5 focus:outline-none"
          />
          <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div>
              <h4 className="text-xs font-medium text-muted mb-1.5">Description</h4>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => save({ description })}
                placeholder="Add a more detailed description…"
                rows={4}
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted mb-1.5">
                Checklist {card.checklist.length > 0 && `(${card.checklist.filter(c => c.done).length}/${card.checklist.length})`}
              </h4>
              <div className="space-y-1.5">
                {card.checklist.map((item, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(i)} className="accent-accent" />
                    <span className={item.done ? "line-through text-muted" : "text-ink"}>{item.text}</span>
                  </label>
                ))}
              </div>
              <form onSubmit={addChecklistItem} className="mt-2">
                <input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add an item"
                  className={fieldClass + " py-1.5"}
                />
              </form>
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted mb-1.5">Comments</h4>
              <div className="space-y-3 mb-3">
                {card.comments.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-ink">{c.user?.name || "Someone"}</span>{" "}
                    <span className="text-muted text-xs">
                      {new Date(c.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <p className="text-ink/80 mt-0.5">{c.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment…"
                  className={fieldClass + " py-1.5"}
                />
                <button className="text-sm bg-accent hover:bg-accent-dark text-white rounded-lg px-3 transition-colors">
                  Post
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-medium text-muted mb-1.5">Assignees</h4>
              <div className="space-y-1.5">
                {boardMembers.map((m) => {
                  const active = card.assignees.some((a) => a._id === m.user._id);
                  return (
                    <button
                      key={m.user._id}
                      onClick={() => toggleAssignee(m.user._id)}
                      className={`w-full flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 transition-colors ${
                        active ? "bg-accent/15 text-accent-light" : "text-ink hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-medium"
                        style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
                      >
                        {m.user.name?.[0]?.toUpperCase()}
                      </span>
                      {m.user.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted mb-1.5">Priority</h4>
              <select
                value={card.priority}
                onChange={(e) => save({ priority: e.target.value })}
                className={fieldClass + " py-1.5"}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted mb-1.5">Due date</h4>
              <input
                type="date"
                value={card.dueDate ? card.dueDate.slice(0, 10) : ""}
                onChange={(e) => save({ dueDate: e.target.value || null })}
                className={fieldClass + " py-1.5"}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-sm text-red-400 hover:text-red-300 hover:underline text-left pt-2 transition-colors"
            >
              Delete card
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete card"
        message={`Are you sure you want to delete "${card.title}"? This cannot be undone.`}
        confirmText="Delete card"
        isDestructive={true}
        loading={isDeleting}
      />
    </div>
  );
}
