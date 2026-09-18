import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2 } from "lucide-react";
import api from "../api/axios.js";
import Select from "./ui/Select.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function MembersPanel({ board, onClose, onChanged }) {
  const toast = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    api.get("/auth/users").then((res) => setAllUsers(res.data));
  }, []);

  const memberIds = board.members.map((m) => m.user._id);
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u._id));

  const nonMemberOptions = nonMembers.map((u) => ({
    value: u._id,
    label: u.name,
    sublabel: u.email,
    badge: u.role === "admin" ? "PM" : "Employee",
    avatarColor: u.avatarColor || "#7C5CFF",
    avatarInitial: u.name?.[0]?.toUpperCase(),
  }));

  const addMember = async () => {
    if (!selected || isAdding) return;
    const userToAdd = nonMembers.find((u) => u._id === selected);
    setIsAdding(true);
    try {
      const res = await api.post(`/boards/${board._id}/members`, { userId: selected, role: "member" });
      onChanged(res.data);
      setSelected("");
      toast.success(`Added ${userToAdd?.name || "member"} to ${board.title}`, { title: "Member Added" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member to project", { title: "Error" });
    } finally {
      setIsAdding(false);
    }
  };

  const removeMember = async (userId) => {
    const userToRemove = board.members.find((m) => m.user._id === userId)?.user;
    try {
      const res = await api.delete(`/boards/${board._id}/members/${userId}`);
      onChanged({ ...board, members: res.data.members });
      toast.info(`Removed ${userToRemove?.name || "member"} from project`, { title: "Member Removed" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member", { title: "Error" });
    }
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Team members"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-pop text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-base font-semibold text-ink truncate">Team on {board.title}</h3>
            <p className="text-xs text-muted mt-0.5">{board.members.length} active member{board.members.length === 1 ? "" : "s"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="w-10 h-10 -mr-2 shrink-0 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto scrollbar-hide pr-1">
          {board.members.map((m) => (
            <div
              key={m.user._id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-2/40 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0 shadow-sm"
                  style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
                >
                  {m.user.name?.[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{m.user.name}</p>
                </div>
                {m.role === "manager" && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent-light font-semibold shrink-0">
                    Manager
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeMember(m.user._id)}
                className="text-xs font-medium text-muted hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 touch-manipulation"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {nonMembers.length === 0 ? (
          <div className="pt-4 border-t border-line">
            <div className="p-3.5 bg-surface-2/60 border border-line/60 rounded-xl text-center">
              <p className="text-xs sm:text-sm text-muted font-medium">
                Everyone in the workspace is already on this project
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-line items-stretch sm:items-center">
            <div className="flex-1 min-w-0">
              <Select
                value={selected}
                onChange={setSelected}
                options={nonMemberOptions}
                placeholder="Add an employee…"
                aria-label="Add an employee"
              />
            </div>
            <button
              type="button"
              onClick={addMember}
              disabled={!selected || isAdding}
              className={`text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 transition-all shrink-0 touch-manipulation flex items-center justify-center gap-1.5 shadow-sm ${
                selected && !isAdding
                  ? "bg-accent hover:bg-accent-dark text-white cursor-pointer active:scale-[0.98]"
                  : "bg-surface-3 text-muted/50 border border-line/60 cursor-not-allowed opacity-60"
              }`}
            >
              <Plus size={15} className="shrink-0" />
              <span>{isAdding ? "Adding…" : "Add member"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
