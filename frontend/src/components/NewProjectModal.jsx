import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { PALETTE } from "../utils/color.js";

// Popup for creating a new project. Only ever rendered for admins (callers
// gate this), but the create button double-checks nothing client-side can
// bypass server-side role checks on POST /api/boards.
export default function NewProjectModal({ onClose, onCreated }) {
  const navigate = useNavigate();
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
      onCreated?.(res.data);
      onClose();
      navigate(`/boards/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] px-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-xl w-full max-w-sm p-5 shadow-pop"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">New project</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>

        {error && (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <label className="block text-xs text-muted mb-1.5">Project name</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Client Website Redesign"
          className="w-full text-sm rounded-lg bg-surface-3 border border-line px-3 py-2 mb-3 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />

        <label className="block text-xs text-muted mb-1.5">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What's this project about?"
          className="w-full text-sm rounded-lg bg-surface-3 border border-line px-3 py-2 mb-3 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
        />

        <label className="block text-xs text-muted mb-1.5">Color</label>
        <div className="flex gap-2 mb-5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full ring-offset-2 ring-offset-surface transition-all"
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }}
            />
          ))}
        </div>

        <button
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create project"}
        </button>
      </form>
    </div>
  );
}
