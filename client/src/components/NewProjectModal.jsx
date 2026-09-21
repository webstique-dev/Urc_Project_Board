import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Plus } from "lucide-react";
import api from "../api/axios.js";
import { PALETTE } from "../utils/color.js";
import { useToast } from "../context/ToastContext.jsx";

// Popup for creating a new project. Only ever rendered for admins (callers
// gate this), but the create button double-checks nothing client-side can
// bypass server-side role checks on POST /api/boards.
export default function NewProjectModal({ onClose, onCreated }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/boards", { title, description, color });
      toast.success(`Project "${title}" created!`, { title: "Success" });
      onCreated?.(res.data);
      onClose();
      navigate(`/boards/${res.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Couldn't create the project.";
      setError(msg);
      toast.error(msg, { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New project"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[60] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-pop text-ink"
      >
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <h3 className="text-base font-semibold text-ink">New project</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 -mr-2 shrink-0 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3.5">
            {error}
          </p>
        )}

        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Project name
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client Website Redesign"
              className="w-full text-base sm:text-sm rounded-lg bg-surface border border-slate-300 px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's this project about?"
              className="w-full text-base sm:text-sm rounded-lg bg-surface border border-slate-300 px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Board Color Accent
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all touch-manipulation focus:outline-none ${
                    color === c ? "ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                >
                  {color === c && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={loading || !title.trim()}
          className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg py-3 transition-colors disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
        >
          {!loading && <Plus size={16} />}
          <span>{loading ? "Creating project…" : "Create project"}</span>
        </button>
      </form>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
