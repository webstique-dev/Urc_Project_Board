import { useEffect, useState, useMemo, useRef } from "react";
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
  UploadCloud,
  Download,
  Eye,
  Loader2,
  FileText,
  Search,
} from "lucide-react";
import api from "../api/axios.js";
import ConfirmationModal from "./ConfirmationModal.jsx";
import AttachmentPreviewModal, { formatFileSize, getFileTypeInfo } from "./AttachmentPreviewModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Select from "./ui/Select.jsx";
import DatePicker from "./ui/DatePicker.jsx";
import CardModalSkeleton from "./ui/CardModalSkeleton.jsx";

import {
  LABEL_COLOR_OPTIONS,
  PRESET_CONSTRUCTION_LABELS,
  getLabelInfo,
  getLabelDotColor,
} from "../utils/labels.js";

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
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> created this card
          {activity.meta?.listTitle ? <span className="text-muted font-medium"> in {activity.meta.listTitle}</span> : ""}
        </span>
      );
    case "moved":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> moved this card
          {activity.meta?.fromList && activity.meta?.toList ? (
            <span className="text-muted font-medium"> from {activity.meta.fromList} to {activity.meta.toList}</span>
          ) : ""}
        </span>
      );
    case "completed":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> marked this card as completed
        </span>
      );
    case "uncompleted":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> marked this card as incomplete
        </span>
      );
    case "priority_changed":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> set priority to{" "}
          <span className="capitalize font-medium text-accent">{activity.meta?.to || "medium"}</span>
        </span>
      );
    case "due_date_changed":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span>{" "}
          {activity.meta?.dueDate
            ? `set due date to ${new Date(activity.meta.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : "removed the due date"}
        </span>
      );
    case "labels_changed":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> updated labels
        </span>
      );
    case "assignees_changed":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> updated members
        </span>
      );
    case "attachment_added":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> attached link{" "}
          <span className="font-medium text-accent">"{activity.meta?.label || activity.meta?.url}"</span>
        </span>
      );
    case "comment_added":
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> added a comment
        </span>
      );
    default:
      return (
        <span className="text-muted">
          <span className="font-semibold text-ink">{userName}</span> updated this card
        </span>
      );
  }
}

export default function CardModal({
  cardId,
  initialCard = null,
  boardMembers = [],
  boardLabels = [],
  boardId = null,
  onClose,
  onChanged,
  onBoardChanged,
}) {
  const { user } = useAuth();
  const toast = useToast();

  const [card, setCard] = useState(initialCard || null);
  const [description, setDescription] = useState(initialCard?.description || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Popover state management
  const [activePopover, setActivePopover] = useState(null); // 'add' | 'members' | 'labels' | 'checklist' | 'attachment' | 'attachment_inline' | 'overflow' | null

  // Attachment form state (Links & Uploads)
  const [attachmentTab, setAttachmentTab] = useState("file"); // 'file' | 'link'
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLabel, setFileLabel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const fileInputRef = useRef(null);

  // Dynamic label management state
  const [labelSearch, setLabelSearch] = useState("");
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_OPTIONS[0].value);
  const [editingLabelObj, setEditingLabelObj] = useState(null);
  const [isSubmittingLabel, setIsSubmittingLabel] = useState(false);

  // Checklist form state
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [editingChecklistKey, setEditingChecklistKey] = useState(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [newItemInputs, setNewItemInputs] = useState({});
  const [memberSearchModal, setMemberSearchModal] = useState("");

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
    type: null, // 'card' | 'comment' | 'attachment' | 'checklist'
    id: null,
    extraIndex: null,
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
    if (initialCard) {
      setCard(initialCard);
      setDescription(initialCard.description || "");
    }
    load();
  }, [cardId]);

  // Click-outside and Escape key listener for active popovers and modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activePopover && !e.target.closest("[data-card-popover]")) {
        setActivePopover(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (confirmState.isOpen) return;
        if (activePopover) {
          e.stopPropagation();
          setActivePopover(null);
        } else if (onClose) {
          e.stopPropagation();
          onClose();
        }
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
  }, [activePopover, confirmState.isOpen, onClose]);

  const save = async (patch) => {
    const previousCard = card;
    try {
      const sanitizedPatch = { ...patch };
      if (Array.isArray(sanitizedPatch.checklists)) {
        sanitizedPatch.checklists = sanitizedPatch.checklists.map((cl) => {
          const isClIdValid = cl._id && /^[0-9a-fA-F]{24}$/.test(String(cl._id));
          const cleanCl = {
            title: cl.title || "Checklist",
            items: (cl.items || []).map((item) => {
              const isItemIdValid = item._id && /^[0-9a-fA-F]{24}$/.test(String(item._id));
              const cleanItem = {
                text: item.text,
                done: Boolean(item.done),
              };
              if (isItemIdValid) cleanItem._id = item._id;
              return cleanItem;
            }),
          };
          if (isClIdValid) cleanCl._id = cl._id;
          return cleanCl;
        });
      }

      // Optimistic local update
      setCard((prev) => (prev ? { ...prev, ...sanitizedPatch } : prev));

      const res = await api.patch(`/cards/${cardId}`, sanitizedPatch);
      setCard(res.data);
      onChanged();
      return res.data;
    } catch (err) {
      // Rollback on failure
      setCard(previousCard);
      toast.error(err.response?.data?.message || "Failed to update card. Reverted changes.");
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

  const toggleLabel = (labelName) => {
    const current = card.labels || [];
    const exists = current.includes(labelName);
    const next = exists
      ? current.filter((l) => l !== labelName)
      : [...current, labelName];
    save({ labels: next });
  };

  const removeLabel = (labelName) => {
    const current = card.labels || [];
    save({ labels: current.filter((l) => l !== labelName) });
  };

  const handleCreateLabelOnBoard = async (e) => {
    e?.preventDefault();
    const name = newLabelName.trim();
    if (!name || isSubmittingLabel) return;
    setIsSubmittingLabel(true);
    try {
      if (boardId) {
        await api.post(`/boards/${boardId}/labels`, {
          name,
          color: newLabelColor,
        });
        if (onBoardChanged) onBoardChanged();
      }
      // Also assign newly created label to current card
      const current = card.labels || [];
      if (!current.includes(name)) {
        await save({ labels: [...current, name] });
      }
      setNewLabelName("");
      setIsCreatingLabel(false);
      toast.success(`Label "${name}" created`, { title: "Success" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create label");
    } finally {
      setIsSubmittingLabel(false);
    }
  };

  const handleUpdateLabelOnBoard = async (e) => {
    e?.preventDefault();
    if (!editingLabelObj || !editingLabelObj.name?.trim() || isSubmittingLabel) return;
    setIsSubmittingLabel(true);
    try {
      if (boardId && editingLabelObj._id) {
        await api.patch(`/boards/${boardId}/labels/${editingLabelObj._id}`, {
          name: editingLabelObj.name.trim(),
          color: editingLabelObj.color,
        });
        if (onBoardChanged) onBoardChanged();
      }
      setEditingLabelObj(null);
      toast.success("Label updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update label");
    } finally {
      setIsSubmittingLabel(false);
    }
  };

  const handleDeleteLabelFromBoard = async (labelId) => {
    if (!boardId || !labelId) return;
    try {
      await api.delete(`/boards/${boardId}/labels/${labelId}`);
      if (onBoardChanged) onBoardChanged();
      setEditingLabelObj(null);
      toast.success("Label removed from project");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete label");
    }
  };

  const getNormalizedChecklists = (cardData) => {
    if (!cardData) return [];
    if (Array.isArray(cardData.checklists) && cardData.checklists.length > 0) {
      return cardData.checklists;
    }
    if (Array.isArray(cardData.checklist) && cardData.checklist.length > 0) {
      return [
        {
          _id: "legacy",
          title: cardData.checklistTitle || "Checklist",
          items: cardData.checklist,
        },
      ];
    }
    if (cardData.checklistTitle && cardData.checklistTitle !== "Checklist" && !cardData.checklists) {
      return [
        {
          _id: "legacy",
          title: cardData.checklistTitle,
          items: [],
        },
      ];
    }
    return [];
  };

  const handleCreateChecklist = async (e) => {
    e?.preventDefault();
    const title = newChecklistTitle.trim();
    if (!title || isCreatingChecklist) return;
    setIsCreatingChecklist(true);
    try {
      const currentChecklists = getNormalizedChecklists(card);
      const updated = [
        ...currentChecklists,
        {
          title,
          items: [],
        },
      ];
      await save({ checklists: updated });
      setNewChecklistTitle("");
      setActivePopover(null);
      toast.success(`Checklist "${title}" created`, { title: "Success" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create checklist");
    } finally {
      setIsCreatingChecklist(false);
    }
  };

  const handleStartEditChecklistTitle = (clKey, currentTitle) => {
    setEditingChecklistKey(clKey);
    setEditingChecklistTitle(currentTitle);
  };

  const handleSaveChecklistTitle = async (checklistId, clIndex) => {
    const title = editingChecklistTitle.trim();
    const currentChecklists = getNormalizedChecklists(card);
    const updated = currentChecklists.map((cl, idx) => {
      const match = (cl._id && String(cl._id) === String(checklistId)) || idx === clIndex;
      if (match) {
        return { ...cl, title: title || cl.title };
      }
      return cl;
    });
    await save({ checklists: updated });
    setEditingChecklistKey(null);
    setEditingChecklistTitle("");
    toast.success("Checklist renamed");
  };

  const confirmDeleteChecklist = (checklistId, clIndex, title) => {
    setConfirmState({
      isOpen: true,
      type: "checklist",
      id: checklistId,
      extraIndex: clIndex,
      title: "Delete checklist?",
      message: "Are you sure you want to delete this checklist and all its items?",
      loading: false,
    });
  };

  const toggleChecklistItem = (checklistId, clIndex, itemIndex) => {
    const currentChecklists = getNormalizedChecklists(card);
    const updated = currentChecklists.map((cl, idx) => {
      const match = (cl._id && String(cl._id) === String(checklistId)) || idx === clIndex;
      if (match) {
        const nextItems = [...(cl.items || [])];
        nextItems[itemIndex] = { ...nextItems[itemIndex], done: !nextItems[itemIndex].done };
        return { ...cl, items: nextItems };
      }
      return cl;
    });
    save({ checklists: updated });
  };

  const addChecklistItem = (e, checklistId, clIndex) => {
    e.preventDefault();
    const key = checklistId || `idx-${clIndex}`;
    const text = (newItemInputs[key] || "").trim();
    if (!text) return;
    const currentChecklists = getNormalizedChecklists(card);
    const updated = currentChecklists.map((cl, idx) => {
      const match = (cl._id && String(cl._id) === String(checklistId)) || idx === clIndex;
      if (match) {
        return {
          ...cl,
          items: [...(cl.items || []), { text, done: false }],
        };
      }
      return cl;
    });
    save({ checklists: updated });
    setNewItemInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const deleteChecklistItem = (checklistId, clIndex, itemIndex) => {
    const currentChecklists = getNormalizedChecklists(card);
    const updated = currentChecklists.map((cl, idx) => {
      const match = (cl._id && String(cl._id) === String(checklistId)) || idx === clIndex;
      if (match) {
        return {
          ...cl,
          items: (cl.items || []).filter((_, i) => i !== itemIndex),
        };
      }
      return cl;
    });
    save({ checklists: updated });
  };

  // Attachments actions
  const handleFileUpload = async (e) => {
    e?.preventDefault();
    if (!selectedFile || isUploading) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size of 25MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (fileLabel.trim()) {
      formData.append("label", fileLabel.trim());
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await api.post(`/cards/${cardId}/attachments/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      setCard(res.data);
      onChanged();
      setSelectedFile(null);
      setFileLabel("");
      setUploadProgress(0);
      setActivePopover(null);
      toast.success("File uploaded successfully", { title: "Success" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

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
      message: `Remove "${label || "this attachment"}" from card attachments?`,
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
      confirmText: "Delete",
      loading: false,
    });
  };

  const handlePromptRemoveAssignee = (member) => {
    const memberId = member._id ? member._id.toString() : String(member);
    const memberName = member.name || "this member";
    setConfirmState({
      isOpen: true,
      type: "remove_assignee",
      id: memberId,
      title: "Remove member?",
      message: `Are you sure you want to remove ${memberName} from this card?`,
      confirmText: "Remove",
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

      if (confirmState.type === "remove_assignee") {
        const current = (card.assignees || []).map((a) => (a._id ? a._id.toString() : String(a)));
        const next = current.filter((id) => id !== confirmState.id);
        const res = await api.patch(`/cards/${cardId}`, { assignees: next });
        setCard(res.data);
        onChanged();
        toast.success("Member removed from card");
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

      if (confirmState.type === "checklist") {
        const currentChecklists = getNormalizedChecklists(card);
        const updated = currentChecklists.filter((cl, idx) => {
          if (confirmState.id && cl._id && String(cl._id) !== "legacy") {
            return String(cl._id) !== String(confirmState.id);
          }
          return idx !== confirmState.extraIndex;
        });
        const res = await api.patch(`/cards/${cardId}`, {
          checklists: updated,
          checklist: [],
          checklistTitle: "",
        });
        setCard(res.data);
        onChanged();
        toast.success("Checklist deleted");
      }

      setConfirmState({ isOpen: false, type: null, id: null, extraIndex: null, title: "", message: "", confirmText: "Delete", loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Build merged chronological feed (comments + activity log) with useMemo to eliminate typing lag
  const feedItems = useMemo(() => {
    if (!card) return [];
    const items = [];

    (card.comments || []).forEach((c) => {
      items.push({
        id: `comment-${c._id}`,
        type: "comment",
        timestamp: new Date(c.createdAt).getTime(),
        data: c,
      });
    });

    (card.activityLog || []).forEach((a, idx) => {
      if (a.action === "comment_added") return;
      items.push({
        id: `activity-${a._id || idx}`,
        type: "activity",
        timestamp: new Date(a.timestamp).getTime(),
        data: a,
      });
    });

    // Sort feed descending (newest first)
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [card?.comments, card?.activityLog]);

  // Activity items filter according to showAllActivity
  const filteredFeedItems = useMemo(() => {
    let activityCount = 0;
    return feedItems.filter((item) => {
      if (item.type === "comment") return true;
      activityCount++;
      if (showAllActivity) return true;
      return activityCount <= 3; // Show latest 3 activity logs by default
    });
  }, [feedItems, showAllActivity]);

  if (!card) return <CardModalSkeleton onClose={onClose} />;

  const cardChecklists = getNormalizedChecklists(card);

  const sortedAttachments = [...(card.attachments || [])].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return 0;
  });

  const totalHiddenActivity = (card.activityLog || []).filter((a) => a.action !== "comment_added").length - 3;

  const fieldClass =
    "w-full text-base sm:text-sm rounded-lg bg-surface border border-line px-3 py-2 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors";

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Card details"
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 z-50 animate-in fade-in duration-200"
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors touch-manipulation cursor-pointer"
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
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
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
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors touch-manipulation cursor-pointer"
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
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-1 cursor-pointer touch-manipulation ${card.completed
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
                  className={`text-lg sm:text-xl font-bold w-full bg-transparent border-b border-transparent hover:border-line focus:border-accent focus:outline-none transition-colors px-1 py-0.5 rounded placeholder:text-muted/60 ${card.completed ? "line-through text-muted" : "text-ink"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-ink font-medium transition-colors cursor-pointer touch-manipulation"
                >
                  <Plus size={14} className="text-accent" />
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
                        setNewChecklistTitle("");
                        setActivePopover("checklist");
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
                placeholder="Due Date"
              />

              {/* Checklist Quick Button & Creation Form Popover */}
              <div className="relative" data-card-popover="true">
                <button
                  type="button"
                  onClick={() => {
                    if (activePopover === "checklist") {
                      setActivePopover(null);
                    } else {
                      setNewChecklistTitle("");
                      setActivePopover("checklist");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-ink font-medium transition-colors cursor-pointer touch-manipulation"
                >
                  <ListChecks size={14} className="text-muted" />
                  <span>Checklist</span>
                </button>

                {activePopover === "checklist" && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-surface border border-line rounded-xl shadow-pop p-3.5 z-[60] space-y-3 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center justify-between pb-1.5 border-b border-line">
                      <span className="text-xs font-bold text-ink">Add Checklist</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePopover(null);
                          setNewChecklistTitle("");
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateChecklist} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-muted mb-1 font-medium">Title</label>
                        <input
                          autoFocus
                          type="text"
                          value={newChecklistTitle}
                          onChange={(e) => setNewChecklistTitle(e.target.value)}
                          placeholder="Checklist title…"
                          className={`${fieldClass} py-1.5 text-xs sm:text-sm`}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePopover(null);
                            setNewChecklistTitle("");
                          }}
                          className="px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors cursor-pointer font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newChecklistTitle.trim() || isCreatingChecklist}
                          className="px-3.5 py-1.5 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          {isCreatingChecklist && <Loader2 size={12} className="animate-spin" />}
                          <span>{isCreatingChecklist ? "Creating…" : "Create"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Attachment Popover Button */}
              <div className="relative" data-card-popover="true">
                <button
                  type="button"
                  onClick={() => setActivePopover(activePopover === "attachment" ? null : "attachment")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-ink font-medium transition-colors cursor-pointer touch-manipulation"
                >
                  <Link2 size={14} className="text-muted" />
                  <span>Attachment</span>
                </button>

                {activePopover === "attachment" && (
                  <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-[350px] max-w-[calc(100vw-32px)] bg-surface border border-line rounded-xl shadow-pop p-3.5 z-[60] space-y-3 animate-in fade-in-50 zoom-in-95">
                    {/* Header with Title and Tabs */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-line">
                      <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-line">
                        <button
                          type="button"
                          onClick={() => setAttachmentTab("file")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            attachmentTab === "file"
                              ? "bg-white text-ink shadow-sm"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachmentTab("link")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            attachmentTab === "link"
                              ? "bg-white text-ink shadow-sm"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          Attach Link
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Tab 1: Upload File */}
                    {attachmentTab === "file" ? (
                      <form onSubmit={handleFileUpload} className="space-y-2.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.zip,.rar,.7z,.tar,.gz,.ppt,.pptx,.xml,.log"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setSelectedFile(e.target.files[0]);
                              setFileLabel(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                            }
                          }}
                        />
                        {!selectedFile ? (
                          <label
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-line hover:border-accent/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer bg-surface-2/30 hover:bg-surface-2/70 transition-all text-center"
                          >
                            <UploadCloud size={24} className="text-accent mb-0.5" />
                            <p className="text-xs font-semibold text-ink">
                              Choose a file <span className="font-normal text-muted">or drag & drop</span>
                            </p>
                            <p className="text-[10.5px] text-muted leading-tight">
                              Images, PDFs, Word, Excel, CSV, ZIP, Text (max 25MB)
                            </p>
                          </label>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-line">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={18} className="text-accent shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-ink truncate">
                                    {selectedFile.name}
                                  </p>
                                  <p className="text-[11px] text-muted">
                                    {formatFileSize(selectedFile.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="text-muted hover:text-rose-600 p-1 transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] text-muted mb-1 font-medium">
                                Display title (optional)
                              </label>
                              <input
                                type="text"
                                value={fileLabel}
                                onChange={(e) => setFileLabel(e.target.value)}
                                placeholder="e.g. Q4 Financial Report"
                                className={fieldClass + " py-1.5 text-xs"}
                              />
                            </div>
                          </div>
                        )}

                        {/* Progress Bar when Uploading */}
                        {isUploading && (
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[11px] text-muted">
                              <span>Uploading file…</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-200 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-line/60">
                          <button
                            type="button"
                            onClick={() => setActivePopover(null)}
                            className="px-2.5 py-1 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!selectedFile || isUploading}
                            className="px-3.5 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            {isUploading && <Loader2 size={13} className="animate-spin" />}
                            <span>{isUploading ? "Uploading…" : "Upload File"}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Tab 2: Attach Link */
                      <form onSubmit={handleAddAttachment} className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] text-muted mb-1 font-medium">Paste web link</label>
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
                          <label className="block text-[11px] text-muted mb-1 font-medium">Link title (optional)</label>
                          <input
                            type="text"
                            value={attachmentLabel}
                            onChange={(e) => setAttachmentLabel(e.target.value)}
                            placeholder="e.g. Design Specs"
                            className={fieldClass + " py-1.5 text-xs"}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-line/60">
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
                            className="px-3.5 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            {isAddingAttachment && <Loader2 size={13} className="animate-spin" />}
                            <span>{isAddingAttachment ? "Attaching…" : "Attach Link"}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
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

                <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
                  {(card.assignees || []).map((u) => {
                    const memberId = u._id ? u._id.toString() : String(u);
                    const memberName = u.name || "Member";
                    return (
                      <div key={memberId} className="relative group/member inline-flex items-center">
                        <span
                          title={memberName}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-sm ring-2 ring-surface shrink-0 cursor-default select-none"
                          style={{ backgroundColor: u.avatarColor || "#0C66E4" }}
                        >
                          {(memberName[0] || "M").toUpperCase()}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${memberName} from card`}
                          title={`Remove ${memberName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromptRemoveAssignee(u);
                          }}
                          className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white flex items-center justify-center shadow-xs border border-white cursor-pointer transition-all duration-150 scale-95 hover:scale-110 opacity-80 sm:opacity-0 sm:group-hover/member:opacity-100 focus:opacity-100 z-10 touch-manipulation"
                        >
                          <X size={8} strokeWidth={3.5} />
                        </button>
                      </div>
                    );
                  })}

                  <div className="relative" data-card-popover="true">
                    <button
                      type="button"
                      onClick={() => setActivePopover(activePopover === "members" ? null : "members")}
                      aria-label="Add member"
                      className="w-7 h-7 rounded-full bg-surface-2 hover:bg-surface-3 border border-line hover:border-accent/50 text-muted hover:text-ink text-xs font-bold flex items-center justify-center transition-colors cursor-pointer touch-manipulation shrink-0"
                      title="Add member"
                    >
                      <Plus size={13} />
                    </button>

                    {activePopover === "members" && (
                      <div className="absolute left-0 top-full mt-1.5 w-64 max-w-[calc(100vw-3rem)] bg-surface border border-line rounded-xl shadow-pop p-2.5 z-[60] space-y-2 animate-in fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between pb-1 border-b border-line/60">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Assign members
                          </p>
                        </div>
                        <div className="relative">
                          <Search size={12} className="absolute left-2 top-2 text-muted" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search members…"
                            value={memberSearchModal}
                            onChange={(e) => setMemberSearchModal(e.target.value)}
                            className="w-full pl-6 pr-2 py-1 text-xs bg-surface-2 border border-line rounded-lg text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                          {boardMembers.length === 0 ? (
                            <p className="text-xs text-muted/60 px-2 py-1">No board members</p>
                          ) : (
                            boardMembers
                              .filter((m) => {
                                if (!memberSearchModal.trim()) return true;
                                const q = memberSearchModal.toLowerCase();
                                return (
                                  m.user?.name?.toLowerCase().includes(q) ||
                                  m.user?.email?.toLowerCase().includes(q)
                                );
                              })
                              .map((m) => {
                                const isAssigned = (card.assignees || []).some(
                                  (a) => (a._id ? a._id.toString() : String(a)) === (m.user?._id ? m.user._id.toString() : String(m.user))
                                );
                                return (
                                  <button
                                    key={m.user._id}
                                    type="button"
                                    onClick={() => toggleAssignee(m.user._id)}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                      isAssigned ? "bg-accent/15 text-accent font-medium" : "text-ink hover:bg-surface-2"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                                        style={{ backgroundColor: m.user.avatarColor || "#0C66E4" }}
                                      >
                                        {m.user.name?.[0]?.toUpperCase()}
                                      </span>
                                      <span className="truncate">{m.user.name}</span>
                                    </div>
                                    {isAssigned && <Check size={13} className="text-accent font-bold" />}
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
                  {(card.labels || []).map((lbl) => {
                    const info = getLabelInfo(lbl, boardLabels);
                    return (
                      <span
                        key={lbl}
                        style={info.style}
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                          info.className || ""
                        }`}
                      >
                        <span>{lbl}</span>
                        <button
                          type="button"
                          onClick={() => removeLabel(lbl)}
                          aria-label={`Remove label ${lbl}`}
                          title={`Remove "${lbl}" from this task`}
                          className="opacity-60 hover:opacity-100 hover:text-rose-600 cursor-pointer ml-0.5 p-0.5 rounded transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}

                  <div className="relative" data-card-popover="true">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePopover(activePopover === "labels" ? null : "labels");
                        setIsCreatingLabel(false);
                        setEditingLabelObj(null);
                        setLabelSearch("");
                      }}
                      aria-label="Add or edit labels"
                      className="h-7 px-2.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line hover:border-accent/50 text-muted hover:text-ink text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation shrink-0"
                      title="Manage labels"
                    >
                      <Plus size={13} />
                      <span>Label</span>
                    </button>

                    {activePopover === "labels" && (
                      <div className="absolute left-0 top-full mt-1.5 w-72 bg-surface border border-line rounded-xl shadow-pop p-3 z-[60] space-y-3 animate-in fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between pb-1 border-b border-line/60">
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
                            <Tag size={12} className="text-accent" />
                            <span>{isCreatingLabel ? "Create Label" : editingLabelObj ? "Edit Label" : "Labels"}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePopover(null);
                              setIsCreatingLabel(false);
                              setEditingLabelObj(null);
                            }}
                            className="text-muted hover:text-ink p-0.5 rounded hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        {/* Search / filter available labels */}
                        {!isCreatingLabel && !editingLabelObj && (
                          <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-2.5 text-muted" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search labels…"
                              value={labelSearch}
                              onChange={(e) => setLabelSearch(e.target.value)}
                              className="w-full pl-7 pr-2 py-1.5 text-xs bg-surface-2 border border-line rounded-lg text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                        )}

                        {/* Edit existing label inline form */}
                        {editingLabelObj && (
                          <form onSubmit={handleUpdateLabelOnBoard} className="space-y-2.5">
                            <div>
                              <label className="text-[11px] font-medium text-muted block mb-1">Label Name</label>
                              <input
                                autoFocus
                                value={editingLabelObj.name || ""}
                                onChange={(e) => setEditingLabelObj({ ...editingLabelObj, name: e.target.value })}
                                className={fieldClass + " py-1.5 text-xs w-full"}
                                placeholder="Label name"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-muted block mb-1">Color</label>
                              <div className="flex flex-wrap gap-1.5">
                                {LABEL_COLOR_OPTIONS.map((c) => (
                                  <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setEditingLabelObj({ ...editingLabelObj, color: c.value })}
                                    style={{ backgroundColor: c.value }}
                                    className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                                      editingLabelObj.color === c.value ? "ring-2 ring-offset-1 ring-accent scale-110" : "hover:scale-105 opacity-85"
                                    }`}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex gap-1.5">
                                <button
                                  type="submit"
                                  disabled={isSubmittingLabel || !editingLabelObj.name?.trim()}
                                  className="px-3 py-1 bg-accent hover:bg-accent-dark text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLabelObj(null)}
                                  className="px-2.5 py-1 text-xs text-muted hover:text-ink cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                              {editingLabelObj._id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLabelFromBoard(editingLabelObj._id)}
                                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                                  title="Delete label from project"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </form>
                        )}

                        {/* Create new label inline form */}
                        {isCreatingLabel && !editingLabelObj && (
                          <form onSubmit={handleCreateLabelOnBoard} className="space-y-2.5">
                            <div>
                              <label className="text-[11px] font-medium text-muted block mb-1">New Label Name</label>
                              <input
                                autoFocus
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                className={fieldClass + " py-1.5 text-xs w-full"}
                                placeholder="e.g. Mechanical, Landscaping…"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-muted block mb-1">Color</label>
                              <div className="flex flex-wrap gap-1.5">
                                {LABEL_COLOR_OPTIONS.map((c) => (
                                  <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setNewLabelColor(c.value)}
                                    style={{ backgroundColor: c.value }}
                                    className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                                      newLabelColor === c.value ? "ring-2 ring-offset-1 ring-accent scale-110" : "hover:scale-105 opacity-85"
                                    }`}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                type="submit"
                                disabled={isSubmittingLabel || !newLabelName.trim()}
                                className="px-3 py-1 bg-accent hover:bg-accent-dark text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                              >
                                Create & Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsCreatingLabel(false)}
                                className="px-2.5 py-1 text-xs text-muted hover:text-ink cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Available Labels List */}
                        {!isCreatingLabel && !editingLabelObj && (
                          <>
                            <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                              {(() => {
                                const allLabels = (boardLabels && boardLabels.length > 0)
                                  ? boardLabels
                                  : PRESET_CONSTRUCTION_LABELS;

                                const filtered = allLabels.filter((l) =>
                                  (l.name || l).toLowerCase().includes(labelSearch.toLowerCase())
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <p className="text-xs text-muted/60 text-center py-2">
                                      No matching labels found
                                    </p>
                                  );
                                }

                                return filtered.map((l) => {
                                  const name = l.name || l;
                                  const isAssigned = (card.labels || []).includes(name);
                                  const info = getLabelInfo(name, boardLabels);

                                  return (
                                    <div
                                      key={name}
                                      className="flex items-center justify-between gap-1 group/item hover:bg-surface-2 rounded-lg p-1 transition-colors"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => toggleLabel(name)}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                                      >
                                        <div
                                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                            isAssigned ? "bg-accent border-accent text-white" : "border-stone-300 bg-white"
                                          }`}
                                        >
                                          {isAssigned && <Check size={11} strokeWidth={3} />}
                                        </div>
                                        <span
                                          style={info.style}
                                          className={`text-xs px-2 py-0.5 rounded border font-medium truncate flex-1 ${
                                            info.className || ""
                                          }`}
                                        >
                                          {name}
                                        </span>
                                      </button>

                                      {l._id && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingLabelObj({ _id: l._id, name: l.name, color: l.color });
                                          }}
                                          className="p-1 text-muted hover:text-ink rounded opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                                          title="Edit label definition"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingLabel(true);
                                setNewLabelName(labelSearch);
                                setNewLabelColor(LABEL_COLOR_OPTIONS[0].value);
                              }}
                              className="w-full text-left text-xs font-medium text-accent hover:text-accent-dark hover:bg-accent/10 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 mt-1 border border-dashed border-accent/30"
                            >
                              <Plus size={13} />
                              <span>Create new label</span>
                            </button>
                          </>
                        )}
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
                    className="text-xs font-semibold text-accent hover:text-accent-dark hover:underline cursor-pointer flex items-center gap-1"
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
                      disabled={isSavingDescription}
                      onClick={async () => {
                        setIsSavingDescription(true);
                        try {
                          await save({ description });
                          setIsEditingDescription(false);
                        } finally {
                          setIsSavingDescription(false);
                        }
                      }}
                      className="px-3.5 py-1.5 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingDescription && <Loader2 size={12} className="animate-spin" />}
                      <span>{isSavingDescription ? "Saving…" : "Save"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSavingDescription}
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
                  className={`p-3 rounded-xl border border-line hover:border-accent/40 bg-surface-2/40 hover:bg-surface-2 cursor-pointer transition-colors text-sm leading-relaxed ${description ? "text-ink whitespace-pre-wrap" : "text-muted/60 italic bg-surface-2/20"
                    }`}
                >
                  {description || "Add a more detailed description…"}
                </div>
              )}
            </div>

            {/* Attachments Section - Supports Uploaded Files & Links */}
            {((card.attachments || []).length > 0 || activePopover === "attachment_inline") && (
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
                      onClick={() => {
                        setActivePopover(activePopover === "attachment_inline" ? null : "attachment_inline");
                        if (activePopover !== "attachment_inline") {
                          setSelectedFile(null);
                          setFileLabel("");
                          setAttachmentUrl("");
                          setAttachmentLabel("");
                        }
                      }}
                      className="text-xs font-semibold text-accent hover:text-accent-dark hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>

                    {activePopover === "attachment_inline" && (
                      <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-surface border border-line rounded-xl shadow-pop p-3.5 z-[60] space-y-3 animate-in fade-in-50 zoom-in-95">
                        {/* Header with Title and Tabs */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-line">
                          <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-line">
                            <button
                              type="button"
                              onClick={() => setAttachmentTab("file")}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                attachmentTab === "file"
                                  ? "bg-white text-ink shadow-sm"
                                  : "text-muted hover:text-ink"
                              }`}
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttachmentTab("link")}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                attachmentTab === "link"
                                  ? "bg-white text-ink shadow-sm"
                                  : "text-muted hover:text-ink"
                              }`}
                            >
                              Attach Link
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActivePopover(null)}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Tab 1: Upload File */}
                        {attachmentTab === "file" ? (
                          <form onSubmit={handleFileUpload} className="space-y-2.5">
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.zip,.rar,.7z,.tar,.gz,.ppt,.pptx,.xml,.log"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setSelectedFile(e.target.files[0]);
                                  setFileLabel(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                                }
                              }}
                            />
                            {!selectedFile ? (
                              <label
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-line hover:border-accent/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer bg-surface-2/30 hover:bg-surface-2/70 transition-all text-center"
                              >
                                <UploadCloud size={24} className="text-accent mb-0.5" />
                                <p className="text-xs font-semibold text-ink">
                                  Choose a file <span className="font-normal text-muted">or drag & drop</span>
                                </p>
                                <p className="text-[10.5px] text-muted leading-tight">
                                  Images, PDFs, Word, Excel, CSV, ZIP, Text (max 25MB)
                                </p>
                              </label>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-line">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={18} className="text-accent shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-ink truncate">
                                        {selectedFile.name}
                                      </p>
                                      <p className="text-[11px] text-muted">
                                        {formatFileSize(selectedFile.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="text-muted hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                <div>
                                  <label className="block text-[11px] text-muted mb-1 font-medium">
                                    Display title (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={fileLabel}
                                    onChange={(e) => setFileLabel(e.target.value)}
                                    placeholder="e.g. Q4 Financial Report"
                                    className={fieldClass + " py-1.5 text-xs"}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Progress Bar when Uploading */}
                            {isUploading && (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[11px] text-muted">
                                  <span>Uploading file…</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-accent transition-all duration-200 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-line/60">
                              <button
                                type="button"
                                onClick={() => setActivePopover(null)}
                                className="px-2.5 py-1 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!selectedFile || isUploading}
                                className="px-3.5 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                              >
                                {isUploading && <Loader2 size={13} className="animate-spin" />}
                                <span>{isUploading ? "Uploading…" : "Upload File"}</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Tab 2: Attach Link */
                          <form onSubmit={handleAddAttachment} className="space-y-2.5">
                            <div>
                              <label className="block text-[11px] text-muted mb-1 font-medium">Paste web link</label>
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
                              <label className="block text-[11px] text-muted mb-1 font-medium">Link title (optional)</label>
                              <input
                                type="text"
                                value={attachmentLabel}
                                onChange={(e) => setAttachmentLabel(e.target.value)}
                                placeholder="e.g. Design Specs"
                                className={fieldClass + " py-1.5 text-xs"}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-line/60">
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
                                className="px-3.5 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                              >
                                {isAddingAttachment && <Loader2 size={13} className="animate-spin" />}
                                <span>{isAddingAttachment ? "Attaching…" : "Attach Link"}</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {sortedAttachments.length > 0 && (
                  <div className="space-y-2">
                    {(showAllAttachments
                      ? sortedAttachments
                      : sortedAttachments.slice(0, 3)
                    ).map((att) => {
                      const fileInfo = getFileTypeInfo(att);
                      const displayName = att.label || att.originalName || att.url;
                      const isServerFile = att.url?.startsWith("/uploads");
                      const apiBase = import.meta.env.VITE_API_URL
                        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
                        : "http://localhost:5000";
                      const fullUrl = isServerFile ? `${apiBase}${att.url}` : att.url;

                      return (
                        <div
                          key={att._id}
                          className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-2 border border-line hover:border-accent/40 transition-colors overflow-hidden"
                        >
                          <div
                            onClick={() => setPreviewAttachment(att)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden cursor-pointer"
                            title={`Preview ${displayName}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center shrink-0 shadow-sm">
                              {fileInfo.icon}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="text-xs sm:text-sm font-semibold text-ink hover:text-accent transition-colors break-words break-all line-clamp-2 leading-tight">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-muted mt-0.5 flex-wrap">
                                <span className="font-semibold uppercase tracking-wider text-[9px] px-1 py-0.2 rounded bg-surface border border-line">
                                  {fileInfo.label}
                                </span>
                                {att.size > 0 && (
                                  <span>• {formatFileSize(att.size)}</span>
                                )}
                                <span>• Added {formatRelativeTime(att.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="p-1.5 text-muted hover:text-ink hover:bg-surface-3 rounded-lg transition-colors text-xs cursor-pointer"
                              title="Preview attachment"
                              aria-label="Preview attachment"
                            >
                              <Eye size={14} />
                            </button>

                            {isServerFile ? (
                              <a
                                href={fullUrl}
                                download={att.originalName || displayName}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="p-1.5 text-muted hover:text-ink hover:bg-surface-3 rounded-lg transition-colors text-xs cursor-pointer"
                                title="Download file"
                                aria-label="Download file"
                              >
                                <Download size={14} />
                              </a>
                            ) : (
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="p-1.5 text-muted hover:text-ink hover:bg-surface-3 rounded-lg transition-colors text-xs cursor-pointer"
                                title="Open link"
                                aria-label="Open link"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => confirmDeleteAttachment(att._id, displayName)}
                              className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs cursor-pointer"
                              title="Remove attachment"
                              aria-label="Remove attachment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {sortedAttachments.length > 3 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAllAttachments(!showAllAttachments)}
                          className="text-xs font-semibold text-accent hover:text-accent-dark bg-surface-2 hover:bg-surface-3 border border-line px-3 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          {showAllAttachments
                            ? "Show less"
                            : `Show all attachments (${sortedAttachments.length})`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Multiple Checklists Section */}
            {cardChecklists.length > 0 && (
              <div className="space-y-4 pt-5 border-t border-line/60">
                {cardChecklists.map((cl, clIndex) => {
                  const clKey = cl._id ? String(cl._id) : `cl-${clIndex}`;
                  const completedCount = (cl.items || []).filter((item) => item.done).length;
                  const totalCount = (cl.items || []).length;
                  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  const isEditingThisTitle = editingChecklistKey === clKey;

                  return (
                    <div
                      key={clKey}
                      className="bg-surface-2/40 border border-line/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-accent/30 transition-all"
                    >
                      {/* Checklist Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs">
                            <ListChecks size={15} />
                          </div>

                          {isEditingThisTitle ? (
                            <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                              <input
                                autoFocus
                                type="text"
                                value={editingChecklistTitle}
                                onChange={(e) => setEditingChecklistTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveChecklistTitle(cl._id, clIndex);
                                  } else if (e.key === "Escape") {
                                    setEditingChecklistKey(null);
                                    setEditingChecklistTitle("");
                                  }
                                }}
                                className={`${fieldClass} py-1 px-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-surface`}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveChecklistTitle(cl._id, clIndex)}
                                className="px-2.5 py-1 text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChecklistKey(null);
                                  setEditingChecklistTitle("");
                                }}
                                className="px-2 py-1 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              <span
                                onClick={() => handleStartEditChecklistTitle(clKey, cl.title)}
                                className="text-sm sm:text-[15px] font-bold text-ink hover:text-accent cursor-pointer truncate transition-colors tracking-tight"
                                title="Click to rename checklist"
                              >
                                {cl.title || "Checklist"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEditChecklistTitle(clKey, cl.title)}
                                className="text-muted/60 hover:text-ink p-1 rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
                                title="Rename checklist"
                                aria-label={`Rename checklist ${cl.title}`}
                              >
                                <Pencil size={11} />
                              </button>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border transition-all ${
                                  percent === 100
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-accent/10 text-accent border-accent/25"
                                }`}
                              >
                                {completedCount}/{totalCount} ({percent}%)
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => confirmDeleteChecklist(cl._id, clIndex, cl.title)}
                          className="text-xs text-muted hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer font-medium shrink-0 flex items-center gap-1"
                        >
                          <Trash2 size={13} className="shrink-0" />
                          <span>Delete</span>
                        </button>
                      </div>

                      {/* Visibly filled progress bar */}
                      <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ease-out shadow-xs ${
                            percent === 100
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-amber-500 to-accent"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Checklist item rows */}
                      {(cl.items || []).length > 0 && (
                        <div className="space-y-1.5 pt-0.5">
                          {(cl.items || []).map((item, itemIdx) => (
                            <div
                              key={item._id || `item-${itemIdx}`}
                              className={`group/item flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-150 ${
                                item.done
                                  ? "bg-surface-2/30 border-line/50 text-muted"
                                  : "bg-surface hover:bg-surface-2/60 border-line hover:border-accent/40 shadow-xs"
                              }`}
                            >
                              {/* Checkbox button */}
                              <button
                                type="button"
                                onClick={() => toggleChecklistItem(cl._id, clIndex, itemIdx)}
                                aria-label={item.done ? "Mark item incomplete" : "Mark item complete"}
                                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer touch-manipulation ${
                                  item.done
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                    : "border-stone-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/50"
                                }`}
                              >
                                {item.done && <Check size={11} strokeWidth={3} />}
                              </button>

                              {/* Item text */}
                              <span
                                onClick={() => toggleChecklistItem(cl._id, clIndex, itemIdx)}
                                className={`text-xs sm:text-sm flex-1 break-words cursor-pointer select-none leading-snug transition-colors ${
                                  item.done ? "line-through text-muted/60" : "text-ink font-medium"
                                }`}
                              >
                                {item.text}
                              </span>

                              {/* Delete item button */}
                              <button
                                type="button"
                                onClick={() => deleteChecklistItem(cl._id, clIndex, itemIdx)}
                                title="Delete item"
                                aria-label="Delete item"
                                className="opacity-0 group-hover/item:opacity-100 text-muted/60 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-all cursor-pointer shrink-0 touch-manipulation"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add item form for this specific checklist */}
                      <form
                        onSubmit={(e) => addChecklistItem(e, cl._id, clIndex)}
                        className="flex items-center gap-2 pt-1"
                      >
                        <div className="relative flex-1">
                          <input
                            value={newItemInputs[clKey] || ""}
                            onChange={(e) =>
                              setNewItemInputs((prev) => ({ ...prev, [clKey]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                addChecklistItem(e, cl._id, clIndex);
                              }
                            }}
                            placeholder={`Add an item to ${cl.title || "checklist"}…`}
                            className={`${fieldClass} text-xs sm:text-sm py-2 px-3.5 bg-surface rounded-xl border-line hover:border-accent/40 focus:border-accent shadow-xs w-full`}
                          />
                        </div>
                        {(newItemInputs[clKey] || "").trim() && (
                          <button
                            type="submit"
                            className="text-xs bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl px-4 py-2 transition-all shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                          >
                            <Plus size={14} />
                            <span>Add</span>
                          </button>
                        )}
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: COMMENTS & ACTIVITY (~40%) ================= */}
          <div className="lg:col-span-5 flex flex-col bg-slate-50/60 overflow-hidden min-h-0">
            {/* Header with Activity Detail Toggle */}
            <div className="p-4 sm:p-5 pb-3 border-b border-line flex items-center justify-between shrink-0 bg-surface">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Comments & Activity</h4>
              <button
                type="button"
                onClick={() => setShowAllActivity((prev) => !prev)}
                className="text-[11px] font-medium text-accent hover:underline cursor-pointer"
              >
                {showAllActivity ? "Collapse activity" : "Show all activity"}
              </button>
            </div>

            {/* Comment Composer Box */}
            <div className="p-4 sm:p-5 border-b border-line shrink-0 bg-surface">
              <form onSubmit={handlePostComment} className="space-y-2.5">
                <div className="flex gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0 shadow-sm mt-0.5"
                    style={{ backgroundColor: user?.avatarColor || "#0C66E4" }}
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
                      <div key={item.id} className="bg-white border border-line rounded-xl p-3 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-semibold shrink-0 shadow-sm"
                              style={{ backgroundColor: c.user?.avatarColor || "#0C66E4" }}
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
                              className="hover:text-accent transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Pencil size={11} />
                              <span>Edit</span>
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => confirmDeleteComment(c._id)}
                              className="hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
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
                  className="w-full py-1.5 text-center text-xs text-accent font-medium hover:underline bg-white border border-line rounded-lg transition-colors cursor-pointer"
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
        confirmText={confirmState.confirmText || "Delete"}
        isDestructive={true}
        loading={confirmState.loading}
      />

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
