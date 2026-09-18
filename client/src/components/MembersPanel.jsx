import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Crown, ShieldCheck } from "lucide-react";
import api from "../api/axios.js";
import Select from "./ui/Select.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function MembersPanel({ board, onClose, onChanged }) {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    api.get("/auth/users").then((res) => setAllUsers(res.data));
  }, []);

  const isCurrentUserBoardManager =
    currentUser?.role === "admin" ||
    board.members.some((m) => m.user._id === currentUser?._id && m.role === "manager");

  const managerCount = board.members.filter((m) => m.role === "manager").length;
  const isSoleManager = managerCount <= 1;

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

  const executeRoleUpdate = async (userId, newRole) => {
    const targetUser = board.members.find((m) => m.user._id === userId)?.user;
    setIsUpdatingRole(true);
    try {
      const res = await api.patch(`/boards/${board._id}/members/${userId}`, { role: newRole });
      onChanged(res.data);
      toast.success(
        `Changed ${targetUser?.name || "member"}'s board role to ${newRole === "manager" ? "Manager" : "Member"}`,
        { title: "Role Updated" }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role", { title: "Error" });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRoleChange = (member, newRole) => {
    if (member.role === newRole) return;
    if (newRole === "member") {
      if (member.role === "manager" && isSoleManager) {
        toast.error("Assign another manager before demoting this one", { title: "Cannot Demote" });
        return;
      }
      setDemoteTarget(member);
    } else {
      executeRoleUpdate(member.user._id, "manager");
    }
  };

  const confirmDemote = async () => {
    if (!demoteTarget) return;
    await executeRoleUpdate(demoteTarget.user._id, "member");
    setDemoteTarget(null);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const userToRemove = removeTarget.user;
    setIsRemoving(true);
    try {
      const res = await api.delete(`/boards/${board._id}/members/${userToRemove._id}`);
      onChanged(res.data);
      toast.info(`Removed ${userToRemove.name || "member"} from project`, { title: "Member Removed" });
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member", { title: "Error" });
    } finally {
      setIsRemoving(false);
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
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-pop text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-base font-semibold text-ink truncate">Team on {board.title}</h3>
            <p className="text-xs text-muted mt-0.5">
              {board.members.length} active member{board.members.length === 1 ? "" : "s"} · {managerCount} manager{managerCount === 1 ? "" : "s"}
            </p>
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

        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto scrollbar-hide pr-1">
          {board.members.map((m) => {
            const isThisMemberSoleManager = m.role === "manager" && isSoleManager;

            return (
              <div
                key={m.user._id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-2/40 hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-semibold shrink-0 shadow-sm"
                    style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
                  >
                    {m.user.name?.[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-ink truncate">{m.user.name}</p>
                      {m.user.role === "admin" && (
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-accent/20 text-accent-light font-semibold shrink-0"
                          title="Workspace PM"
                        >
                          PM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate">{m.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Board Role Control */}
                  {isCurrentUserBoardManager ? (
                    isThisMemberSoleManager ? (
                      <div className="flex flex-col items-end">
                        <span
                          className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-accent/20 text-accent-light font-semibold flex items-center gap-1 cursor-default border border-accent/30"
                          title="Sole manager — assign another manager before demoting"
                        >
                          <Crown size={11} className="shrink-0" />
                          <span>Manager</span>
                        </span>
                        <span className="text-[9px] text-muted/60 mt-0.5">Sole manager</span>
                      </div>
                    ) : (
                      <div className="w-28 sm:w-32">
                        <Select
                          value={m.role}
                          onChange={(newRole) => handleRoleChange(m, newRole)}
                          options={[
                            {
                              value: "manager",
                              label: "Manager",
                              icon: <Crown size={12} className="text-accent-light shrink-0" />,
                            },
                            {
                              value: "member",
                              label: "Member",
                              icon: <ShieldCheck size={12} className="text-muted shrink-0" />,
                            },
                          ]}
                          className="text-xs"
                          buttonClassName="py-1 px-2 text-xs h-7"
                          menuClassName="w-32 right-0 left-auto"
                        />
                      </div>
                    )
                  ) : m.role === "manager" ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent-light font-semibold shrink-0 flex items-center gap-1">
                      <Crown size={11} className="shrink-0" />
                      <span>Manager</span>
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-muted font-semibold shrink-0">
                      Member
                    </span>
                  )}

                  {/* Remove Member Action */}
                  {isCurrentUserBoardManager && (
                    isThisMemberSoleManager ? (
                      <button
                        type="button"
                        disabled
                        aria-label="Cannot remove sole manager"
                        title="Assign another manager before removing this one"
                        className="text-xs font-medium text-muted/30 cursor-not-allowed px-2 py-1 rounded-lg shrink-0"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(m)}
                        aria-label={`Remove ${m.user.name}`}
                        className="text-xs font-medium text-muted hover:text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors shrink-0 touch-manipulation cursor-pointer"
                      >
                        Remove
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
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

      {/* Confirmation modal for demoting a manager */}
      <ConfirmationModal
        isOpen={!!demoteTarget}
        onClose={() => setDemoteTarget(null)}
        onConfirm={confirmDemote}
        title="Demote manager"
        message={`Are you sure you want to demote ${demoteTarget?.user?.name} to Member? They will lose manager permissions on this board.`}
        confirmText="Demote to member"
        variant="warning"
        loading={isUpdatingRole}
      />

      {/* Confirmation modal for removing a member */}
      <ConfirmationModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="Remove member"
        message={`Are you sure you want to remove ${removeTarget?.user?.name} from ${board.title}?`}
        confirmText="Remove member"
        isDestructive={true}
        loading={isRemoving}
      />
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
