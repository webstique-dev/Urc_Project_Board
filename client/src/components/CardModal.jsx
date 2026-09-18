import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Check,
  MoreHorizontal,
  Trash2,
  Pencil,
  Users,
  Tag,
  ListChecks,
  Link2,
  ExternalLink,
} from "lucide-react";
import api from "../api/axios.js";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Select from "./ui/Select.jsx";
import DatePicker from "./ui/DatePicker.jsx";

const PRIORITY_OPTIONS = [
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
];

const PRESET_LABELS = ["Bug", "Feature", "Design", "Frontend", "Backend", "Urgent", "Docs"];

function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return "just now";
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDomain(url) {
  try {
    const validUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const parsed = new URL(validUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderActivityText(activity) {
  const userName = activity.user?.name || "Someone";
  switch (activity.action) {
    case "created":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> created this card
          {activity.meta?.listTitle ? <span className="text-muted"> in {activity.meta.listTitle}</span> : ""}
        </>
      );
    case "moved":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> moved this card
          {activity.meta?.fromList && activity.meta?.toList ? (
            <span className="text-muted"> from {activity.meta.fromList} to {activity.meta.toList}</span>
          ) : ""}
        </>
      );
    case "completed":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> marked this card as completed
        </>
      );
    case "uncompleted":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> marked this card as incomplete
        </>
      );
    case "priority_changed":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> set priority to{" "}
          <span className="capitalize font-medium text-accent-light">{activity.meta?.to || "medium"}</span>
        </>
      );
    case "due_date_changed":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span>{" "}
          {activity.meta?.dueDate
            ? `set due date to ${new Date(activity.meta.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : "removed the due date"}
        </>
      );
    case "labels_changed":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> updated labels
        </>
      );
    case "assignees_changed":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> updated members
        </>
      );
    case "attachment_added":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> attached link{" "}
          <span className="font-medium text-accent-light">"{activity.meta?.label || activity.meta?.url}"</span>
        </>
      );
    case "comment_added":
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> added a comment
        </>
      );
    default:
      return (
        <>
          <span className="font-semibold text-ink">{userName}</span> updated this card
        </>
      );
  }
}

export default function CardModal({ cardId, boardMembers = [], onClose, onChanged }) {
  const { user } = useAuth();
  const toast = useToast();

  const [card, setCard] = useState(null);
  const [description, setDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Popover state management
  const [activePopover, setActivePopover] = useState(null); // 'add' | 'members' | 'labels' | 'attachment' | 'attachment_inline' | 'overflow' | null

  // Attachment form state
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);

  // Label form state
  const [customLabel, setCustomLabel] = useState("");

  // Checklist form state
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Activity filter state
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null, // 'card' | 'comment' | 'attachment'
    id: null,
    title: "",
    message: "",
    loading: false,
  });

  const load = async () => {
    try {
      const res = await api.get(`/cards/${cardId}`);
      setCard(res.data);
      setDescription(res.data.description || "");
    } catch (err) {
      toast.error("Failed to load card details");
      onClose();
    }
  };

  useEffect(() => {
    load();
  }, [cardId]);

  // Click-outside and Escape key listener for active popovers
  useEffect(() => {
    if (!activePopover) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-card-popover]")) {
        setActivePopover(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setActivePopover(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopover]);

  const save = async (patch) => {
    try {
      const res = await api.patch(`/cards/${cardId}`, patch);
      setCard(res.data);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update card");
    }
  };

  const toggleCompleted = () => {
    const nextCompleted = !card.completed;
    save({ completed: nextCompleted });
    if (nextCompleted) {
      toast.success("Card marked completed", { title: "Completed" });
    }
  };

  const toggleAssignee = (userId) => {
    const current = (card.assignees || []).map((a) => (a._id ? a._id : a));
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    save({ assignees: next });
  };

  const addLabel = (labelName) => {
    const trimmed = labelName.trim();
    if (!trimmed) return;
    const current = card.labels || [];
    if (!current.includes(trimmed)) {
      save({ labels: [...current, trimmed] });
    }
    setCustomLabel("");
    setActivePopover(null);
  };

  const removeLabel = (labelName) => {
    const current = card.labels || [];
    save({ labels: current.filter((l) => l !== labelName) });
  };

  const toggleChecklistItem = (index) => {
    const next = [...(card.checklist || [])];
    next[index] = { ...next[index], done: !next[index].done };
    save({ checklist: next });
  };

  const addChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    save({
      checklist: [...(card.checklist || []), { text: newChecklistItem.trim(), done: false }],
    });
    setNewChecklistItem("");
  };

  const deleteChecklistItem = (index) => {
    const next = (card.checklist || []).filter((_, i) => i !== index);
    save({ checklist: next });
  };

  // Attachments actions
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentUrl.trim()) return;
    setIsAddingAttachment(true);
    try {
      let formattedUrl = attachmentUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      const res = await api.post(`/cards/${cardId}/attachments`, {
        url: formattedUrl,
        label: attachmentLabel.trim() || getDomain(formattedUrl),
      });
      setCard(res.data);
      onChanged();
      setAttachmentUrl("");
      setAttachmentLabel("");
      setActivePopover(null);
      toast.success("Attachment link added", { title: "Success" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add attachment");
    } finally {
      setIsAddingAttachment(false);
    }
  };

  const confirmDeleteAttachment = (attId, label) => {
    setConfirmState({
      isOpen: true,
      type: "attachment",
      id: attId,
      title: "Remove attachment?",
      message: `Remove "${label || "this link"}" from card attachments?`,
      loading: false,
    });
  };

  // Comments actions
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/cards/${cardId}/comments`, { text: commentText.trim() });
      setCard(res.data);
      onChanged();
      setCommentText("");
      toast.success("Comment posted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await api.patch(`/cards/${cardId}/comments/${commentId}`, {
        text: editingCommentText.trim(),
      });
      setCard(res.data);
      onChanged();
      setEditingCommentId(null);
      setEditingCommentText("");
      toast.success("Comment updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit comment");
    }
  };

  const confirmDeleteComment = (commentId) => {
    setConfirmState({
      isOpen: true,
      type: "comment",
      id: commentId,
      title: "Delete comment?",
      message: "Are you sure you want to delete this comment? This cannot be undone.",
      loading: false,
    });
  };

  // Generic confirmation execution
  const handleConfirmAction = async () => {
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmState.type === "card") {
        await api.delete(`/cards/${cardId}`);
        toast.success("Card deleted", { title: "Deleted" });
        onChanged();
        setConfirmState({ isOpen: false, type: null, id: null });
        onClose();
        return;
      }

      if (confirmState.type === "attachment") {
        const res = await api.delete(`/cards/${cardId}/attachments/${confirmState.id}`);
        setCard(res.data);
        onChanged();
        toast.success("Attachment removed");
      }

      if (confirmState.type === "comment") {
        const res = await api.delete(`/cards/${cardId}/comments/${confirmState.id}`);
        setCard(res.data);
        onChanged();
        toast.success("Comment deleted");
      }

      setConfirmState({ isOpen: false, type: null, id: null });
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!card) return null;

  // Build merged chronological feed (comments + activity log)
  const feedItems = [];

  (card.comments || []).forEach((c) => {
    feedItems.push({
      id: `comment-${c._id}`,
      type: "comment",
      timestamp: new Date(c.createdAt).getTime(),
      data: c,
    });
  });

  (card.activityLog || []).forEach((a, idx) => {
    if (a.action === "comment_added") return;
    feedItems.push({
      id: `activity-${a._id || idx}`,
      type: "activity",
      timestamp: new Date(a.timestamp).getTime(),
      data: a,
    });
  });

  // Sort feed descending (newest first)
  feedItems.sort((a, b) => b.timestamp - a.timestamp);

  // Activity items filter according to showAllActivity
  let activityCount = 0;
  const filteredFeedItems = feedItems.filter((item) => {
    if (item.type === "comment") return true;
    activityCount++;
    if (showAllActivity) return true;
    return activityCount <= 3; // Show latest 3 activity logs by default
  });

  const totalHiddenActivity = (card.activityLog || []).filter((a) => a.action !== "comment_added").length - 3;

  const checklistCompleted = (card.checklist || []).filter((c) => c.done).length;
  const checklistTotal = (card.checklist || []).length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

  const fieldClass =
    "w-full text-base sm:text-sm rounded-lg bg-surface-3 border border-line px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40";

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Card details"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-5xl h-[92vh] sm:h-[86vh] flex flex-col shadow-pop overflow-hidden text-ink relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar: Breadcrumb, Overflow Actions, Close */}
        <div className="bg-surface/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-line flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 max-w-[calc(100%-80px)]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-line text-xs font-medium text-muted truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span className="truncate">Projects</span>
              <span className="text-muted/60">/</span>
              <span className="text-ink font-semibold truncate">{card.list?.title || "In Progress"}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Overflow Menu Button */}
            <div className="relative" data-card-popover="true">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === "overflow" ? null : "overflow")}
                aria-label="More options"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 transition-colors touch-manipulation cursor-pointer"
              >
                <MoreHorizontal size={16} />
              </button>

              {activePopover === "overflow" && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface border border-line rounded-xl shadow-pop p-1.5 z-[60] animate-in fade-in-50 zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePopover(null);
                      setConfirmState({
                        isOpen: true,
                        type: "card",
                        id: cardId,
                        title: "Delete card",
                        message: `Are you sure you want to delete "${card.title}"? This action cannot be undone.`,
                      });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Delete card</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 transition-colors touch-manipulation cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* ================= LEFT COLUMN: CARD DETAILS (~60%) ================= */}
          <div className="lg:col-span-7 flex flex-col overflow-y-auto scrollbar-hide p-5 sm:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-line">
            {/* Title Bar with Circular Checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={toggleCompleted}
                title={card.completed ? "Mark incomplete" : "Mark completed"}
                aria-label={card.completed ? "Mark incomplete" : "Mark completed"}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-1 cursor-pointer touch-manipulation ${
                  card.completed
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                    : "border-muted/40 hover:border-accent hover:bg-accent/10 text-transparent"
                }`}
              >
                <Check size={14} strokeWidth={3} className={card.completed ? "block" : "hidden"} />
              </button>

              <div className="flex-1 min-w-0">
                <input
                  value={card.title}
                  onChange={(e) => setCard({ ...card, title: e.target.value })}
                  onBlur={() => save({ title: card.title })}
                  className={`text-lg sm:text-xl font-bold w-full bg-transparent border-b border-transparent hover:border-line focus:border-accent focus:outline-none transition-colors px-1 py-0.5 rounded ${
                    card.completed ? "line-through text-muted" : "text-ink"
                  }`}
                  placeholder="Card title…"
                />
              </div>
            </div>

            {/* Quick Action Buttons Row */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* + Add Popover */}
              <div className="relative" data-card-popover="true">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === "add" ? null : "add")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line text-ink font-medium transition-colors cursor-pointer touch-manipulation"
                >
                  <Plus size={14} className="text-accent-light" />
                  <span>Add</span>
                </button>

                {activePopover === "add" && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 bg-surface border border-line rounded-xl shadow-pop p-1.5 z-[60] space-y-1 animate-in fade-in-50 zoom-in-95">
                    <button
                      type="button"
                      onClick={() => setActivePopover("members")}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-ink hover:bg-surface-2 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Users size={14} className="text-muted shrink-0" />
                      <span>Members</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePopover("labels")}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-ink hover:bg-surface-2 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Tag size={14} className="text-muted shrink-0" />
                      <span>Labels</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePopover(null);
                        if (!card.checklist || card.checklist.length === 0) {
                          save({ checklist: [{ text: "Initial task item", done: false }] });
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-ink hover:bg-surface-2 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <ListChecks size={14} className="text-muted shrink-0" />
                      <span>Checklist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePopover("attachment")}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-ink hover:bg-surface-2 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Link2 size={14} className="text-muted shrink-0" />
                      <span>Attachment link</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Themed DatePicker Popover */}
              <DatePicker
                value={card.dueDate}
                onChange={(val) => save({ dueDate: val })}
                placeholder="Dates"
              />

              {/* Checklist Quick Button */}
              <button
                type="button"
                onClick={() => {
                  if (!card.checklist || card.checklist.length === 0) {
                    save({ checklist: [{ text: "New task", done: false }] });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line text-ink font-medium transition-colors cursor-pointer touch-manipulation"
              >
                <ListChecks size={14} className="text-muted" />
                <span>Checklist</span>
              </button>

              {/* Attachment Popover Button */}
              <div className="relative" data-card-popover="true">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === "attachment" ? null : "attachment")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-2 border border-line text-ink font-medium transition-colors cursor-pointer touch-manipulation"
                >
                  <Link2 size={14} className="text-muted" />
                  <span>Attachment</span>
                </button>

                {activePopover === "attachment" && (
                  <form
                    onSubmit={handleAddAttachment}
                    className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-32px)] bg-surface border border-line rounded-xl shadow-pop p-3.5 z-[60] space-y-3 animate-in fade-in-50 zoom-in-95"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Attach a link</p>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Paste web link</label>
                      <input
                        autoFocus
                        required
                        type="text"
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        placeholder="https://example.com/spec"
                        className={fieldClass + " py-1.5 text-xs"}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Link title (optional)</label>
                      <input
                        type="text"
                        value={attachmentLabel}
                        onChange={(e) => setAttachmentLabel(e.target.value)}
                        placeholder="e.g. Design Specs"
                        className={fieldClass + " py-1.5 text-xs"}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60">
                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        className="px-2.5 py-1 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingAttachment || !attachmentUrl.trim()}
                        className="px-3 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isAddingAttachment ? "Attaching…" : "Attach"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Properties Row: Members, Labels & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-5 border-t border-line/60">
              {/* Members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Members</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
                  {(card.assignees || []).map((u) => (
                    <span
                      key={u._id}
                      title={u.name}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-sm ring-2 ring-surface shrink-0"
                      style={{ backgroundColor: u.avatarColor || "#7C5CFF" }}
                    >
                      {u.name?.[0]?.toUpperCase()}
                    </span>
                  ))}

                  <div className="relative" data-card-popover="true">
                    <button
                      type="button"
                      onClick={() => setActivePopover(activePopover === "members" ? null : "members")}
                      aria-label="Add member"
                      className="w-7 h-7 rounded-full bg-surface-3 hover:bg-surface-2 border border-line hover:border-accent/50 text-muted hover:text-ink text-xs font-bold flex items-center justify-center transition-colors cursor-pointer touch-manipulation shrink-0"
                      title="Add member"
                    >
                      <Plus size={13} />
                    </button>

                    {activePopover === "members" && (
                      <div className="absolute left-0 top-full mt-1.5 w-60 bg-surface border border-line rounded-xl shadow-pop p-2 z-[60] space-y-1 animate-in fade-in-50 zoom-in-95">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted px-1.5 py-1">
                          Assign members
                        </p>
                        <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                          {boardMembers.length === 0 ? (
                            <p className="text-xs text-muted/60 px-2 py-1">No board members</p>
                          ) : (
                            boardMembers.map((m) => {
                              const isAssigned = (card.assignees || []).some((a) => (a._id || a) === m.user._id);
                              return (
                                <button
                                  key={m.user._id}
                                  type="button"
                                  onClick={() => toggleAssignee(m.user._id)}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                    isAssigned ? "bg-accent/20 text-accent-light font-medium" : "text-ink hover:bg-surface-2"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                                      style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
                                    >
                                      {m.user.name?.[0]?.toUpperCase()}
                                    </span>
                                    <span className="truncate">{m.user.name}</span>
                                  </div>
                                  {isAssigned && <Check size={13} className="text-accent-light font-bold" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {(card.assignees || []).length === 0 && (
                    <span className="text-xs text-muted/60 italic ml-1">No members</span>
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Labels</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
                  {(card.labels || []).map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 text-accent-light font-medium"
                    >
                      <span>{lbl}</span>
                      <button
                        type="button"
                        onClick={() => removeLabel(lbl)}
                        aria-label={`Remove label ${lbl}`}
                        className="hover:text-rose-400 cursor-pointer ml-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}

                  <div className="relative" data-card-popover="true">
                    <button
                      type="button"
                      onClick={() => setActivePopover(activePopover === "labels" ? null : "labels")}
                      aria-label="Add label"
                      className="h-7 px-2 rounded-md bg-surface-3 hover:bg-surface-2 border border-line hover:border-accent/50 text-muted hover:text-ink text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer touch-manipulation shrink-0"
                      title="Add label"
                    >
                      <Plus size={13} />
                    </button>

                    {activePopover === "labels" && (
                      <div className="absolute left-0 top-full mt-1.5 w-60 bg-surface border border-line rounded-xl shadow-pop p-3 z-[60] space-y-2.5 animate-in fade-in-50 zoom-in-95">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Add Label</p>
                        <div className="flex gap-1.5">
                          <input
                            autoFocus
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addLabel(customLabel)}
                            placeholder="New label…"
                            className={fieldClass + " py-1 text-xs flex-1"}
                          />
                          <button
                            type="button"
                            onClick={() => addLabel(customLabel)}
                            className="px-2.5 py-1 bg-accent hover:bg-accent-dark text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted uppercase tracking-wider">Presets</p>
                          <div className="flex flex-wrap gap-1">
                            {PRESET_LABELS.map((p) => {
                              const active = (card.labels || []).includes(p);
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => (active ? removeLabel(p) : addLabel(p))}
                                  className={`text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                                    active
                                      ? "bg-accent text-white font-medium"
                                      : "bg-surface-3 hover:bg-surface-2 text-ink border border-line"
                                  }`}
                                >
                                  <span>{p}</span>
                                  {active ? <X size={10} /> : <Plus size={10} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(card.labels || []).length === 0 && (
                    <span className="text-xs text-muted/60 italic ml-1">No labels</span>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">Priority</span>
                </div>
                <div className="min-h-[32px]">
                  <Select
                    options={PRIORITY_OPTIONS}
                    value={card.priority}
                    onChange={(val) => save({ priority: val })}
                    placeholder="Select priority"
                    buttonClassName="py-1 text-xs sm:text-sm h-[32px]"
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="pt-5 border-t border-line/60 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Description</h4>
                {!isEditingDescription && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs font-semibold text-accent-light hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2.5">
                  <textarea
                    autoFocus
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description…"
                    rows={4}
                    className={`${fieldClass} resize-none`}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        save({ description });
                        setIsEditingDescription(false);
                      }}
                      className="px-3.5 py-1.5 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDescription(card.description || "");
                        setIsEditingDescription(false);
                      }}
                      className="px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className={`p-3 rounded-xl border border-line/40 hover:border-line hover:bg-surface-2/40 cursor-pointer transition-colors text-sm leading-relaxed ${
                    description ? "text-ink whitespace-pre-wrap" : "text-muted/60 italic bg-surface-2/20"
                  }`}
                >
                  {description || "Add a more detailed description…"}
                </div>
              )}
            </div>

            {/* Attachments Section (Links) */}
            <div className="pt-5 border-t border-line/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <span>Attachments</span>
                  <span className="text-[11px] text-muted/60 font-normal">
                    ({(card.attachments || []).length})
                  </span>
                </h4>
                <div className="relative" data-card-popover="true">
                  <button
                    type="button"
                    onClick={() => setActivePopover(activePopover === "attachment_inline" ? null : "attachment_inline")}
                    className="text-xs font-semibold text-accent-light hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add link</span>
                  </button>

                  {activePopover === "attachment_inline" && (
                    <form
                      onSubmit={handleAddAttachment}
                      className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-32px)] bg-surface border border-line rounded-xl shadow-pop p-3.5 z-[60] space-y-3 animate-in fade-in-50 zoom-in-95"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Attach a link</p>
                      <div>
                        <label className="block text-[11px] text-muted mb-1">Paste web link</label>
                        <input
                          autoFocus
                          required
                          type="text"
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                          placeholder="https://example.com/spec"
                          className={fieldClass + " py-1.5 text-xs"}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-muted mb-1">Link title (optional)</label>
                        <input
                          type="text"
                          value={attachmentLabel}
                          onChange={(e) => setAttachmentLabel(e.target.value)}
                          placeholder="e.g. Design Specs"
                          className={fieldClass + " py-1.5 text-xs"}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60">
                        <button
                          type="button"
                          onClick={() => setActivePopover(null)}
                          className="px-2.5 py-1 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isAddingAttachment || !attachmentUrl.trim()}
                          className="px-3 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isAddingAttachment ? "Attaching…" : "Attach"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {(card.attachments || []).length === 0 ? (
                <div className="p-3.5 bg-surface-2/30 border border-dashed border-line/60 rounded-xl text-center">
                  <p className="text-xs text-muted/70">No attachments yet. Paste any link to reference specs or PRs.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(card.attachments || []).map((att) => {
                    const domain = getDomain(att.url);
                    return (
                      <div
                        key={att._id}
                        className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-2/50 border border-line/60 hover:border-accent/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-surface-3 border border-line flex items-center justify-center shrink-0 text-accent-light">
                            <Link2 size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-sm font-medium text-ink hover:text-accent-light transition-colors truncate block"
                            >
                              {att.label || domain}
                            </a>
                            <p className="text-[11px] text-muted truncate">{domain} • Added {formatRelativeTime(att.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="p-1.5 text-muted hover:text-ink hover:bg-surface-3 rounded-lg transition-colors text-xs"
                            title="Open link"
                            aria-label="Open link"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => confirmDeleteAttachment(att._id, att.label)}
                            className="p-1.5 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs cursor-pointer"
                            title="Remove attachment"
                            aria-label="Remove attachment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Checklist Section - Visually Polished */}
            {card.checklist && card.checklist.length > 0 && (
              <div className="pt-5 border-t border-line/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">Checklist</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-light">
                      {checklistCompleted}/{checklistTotal} ({checklistPercent}%)
                    </span>
                  </div>
                </div>

                {/* Visibly filled progress bar */}
                <div className="w-full h-2 bg-surface-3 border border-line/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-light transition-all duration-300 rounded-full shadow-sm"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>

                {/* Checklist item rows with generous tap padding and custom checkboxes */}
                <div className="space-y-1.5">
                  {card.checklist.map((item, i) => (
                    <div
                      key={i}
                      className={`group flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                        item.done
                          ? "bg-surface-2/20 border-line/30"
                          : "bg-surface-2/40 hover:bg-surface-2 border-line/60 hover:border-accent/40"
                      }`}
                    >
                      {/* Styled Theme Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => toggleChecklistItem(i)}
                        aria-label={item.done ? "Mark item incomplete" : "Mark item complete"}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer touch-manipulation ${
                          item.done
                            ? "bg-accent border-accent text-white shadow-sm"
                            : "border-line bg-surface-3 hover:border-accent/60"
                        }`}
                      >
                        {item.done && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* Item Text */}
                      <span
                        onClick={() => toggleChecklistItem(i)}
                        className={`text-xs sm:text-sm break-words flex-1 cursor-pointer leading-relaxed select-none ${
                          item.done ? "line-through text-muted/70" : "text-ink font-medium"
                        }`}
                      >
                        {item.text}
                      </span>

                      {/* Trailing Delete Action */}
                      <button
                        type="button"
                        onClick={() => deleteChecklistItem(i)}
                        title="Delete item"
                        aria-label="Delete item"
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer shrink-0 touch-manipulation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add an item input form matching other inputs */}
                <form onSubmit={addChecklistItem} className="flex gap-2 pt-1">
                  <input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addChecklistItem(e);
                      }
                    }}
                    placeholder="Add an item to checklist…"
                    className={`${fieldClass} text-xs sm:text-sm py-2 flex-1`}
                  />
                  {newChecklistItem.trim() && (
                    <button
                      type="submit"
                      className="text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg px-3.5 py-2 transition-colors shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: COMMENTS & ACTIVITY (~40%) ================= */}
          <div className="lg:col-span-5 flex flex-col bg-surface-2/20 overflow-hidden min-h-0">
            {/* Header with Activity Detail Toggle */}
            <div className="p-4 sm:p-5 pb-3 border-b border-line flex items-center justify-between shrink-0 bg-surface/40">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Comments & Activity</h4>
              <button
                type="button"
                onClick={() => setShowAllActivity((prev) => !prev)}
                className="text-[11px] font-medium text-accent-light hover:underline cursor-pointer"
              >
                {showAllActivity ? "Collapse activity" : "Show all activity"}
              </button>
            </div>

            {/* Comment Composer Box */}
            <div className="p-4 sm:p-5 border-b border-line shrink-0 bg-surface/30">
              <form onSubmit={handlePostComment} className="space-y-2.5">
                <div className="flex gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0 shadow-sm mt-0.5"
                    style={{ backgroundColor: user?.avatarColor || "#7C5CFF" }}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handlePostComment(e);
                      }
                    }}
                    placeholder="Write a comment… (Ctrl+Enter to post)"
                    rows={2}
                    className={`${fieldClass} py-2 text-xs sm:text-sm resize-none`}
                  />
                </div>

                {commentText.trim() && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      className="px-3.5 py-1.5 bg-accent hover:bg-accent-dark text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isSubmittingComment ? "Posting…" : "Send comment"}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Unified Chronological Feed (Scrolls independently) */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-5 space-y-3">
              {filteredFeedItems.length === 0 ? (
                <p className="text-xs text-muted/60 text-center py-6 italic">No activity or comments yet.</p>
              ) : (
                filteredFeedItems.map((item) => {
                  if (item.type === "comment") {
                    const c = item.data;
                    const isAuthor = c.user?._id === user?._id;
                    const canManage = isAuthor || user?.role === "admin";
                    const isEditing = editingCommentId === c._id;

                    return (
                      <div key={item.id} className="bg-surface border border-line/70 rounded-xl p-3 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                              style={{ backgroundColor: c.user?.avatarColor || "#7C5CFF" }}
                            >
                              {c.user?.name?.[0]?.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-ink truncate">{c.user?.name || "Member"}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-muted shrink-0">
                            <span title={new Date(c.createdAt).toLocaleString()}>{formatRelativeTime(c.createdAt)}</span>
                            {c.editedAt && <span className="italic">(edited)</span>}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              rows={2}
                              className={fieldClass + " py-1.5 text-xs"}
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 text-xs text-muted hover:text-ink cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateComment(c._id)}
                                className="px-3 py-1 text-xs bg-accent text-white font-semibold rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-ink/90 leading-relaxed whitespace-pre-wrap break-words">
                            {c.text}
                          </p>
                        )}

                        {canManage && !isEditing && (
                          <div className="flex items-center gap-2 pt-1 border-t border-line/40 text-[11px] text-muted">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(c._id);
                                setEditingCommentText(c.text);
                              }}
                              className="hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Pencil size={11} />
                              <span>Edit</span>
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => confirmDeleteComment(c._id)}
                              className="hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 size={11} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Activity entry
                  const a = item.data;
                  return (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs text-muted py-1 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0 mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <p className="leading-snug break-words">{renderActivityText(a)}</p>
                        <span className="text-[10px] text-muted/60" title={new Date(a.timestamp).toLocaleString()}>
                          {formatRelativeTime(a.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {!showAllActivity && totalHiddenActivity > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllActivity(true)}
                  className="w-full py-1.5 text-center text-xs text-accent-light font-medium hover:underline bg-surface/40 border border-line/40 rounded-lg transition-colors cursor-pointer"
                >
                  Show {totalHiddenActivity} older activity {totalHiddenActivity === 1 ? "entry" : "entries"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null, id: null })}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Delete"
        isDestructive={true}
        loading={confirmState.loading}
      />
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
