import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderKanban, Filter, ArrowRight } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { boardGradient } from "../utils/color.js";
import NewProjectModal from "../components/NewProjectModal.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filters, setFilters] = useState({ members: [] });
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/boards").then((res) => setBoards(res.data));

  useEffect(() => {
    load().finally(() => setLoading(false));
    api.get("/auth/users").then((res) => setAllUsers(res.data)).catch(() => {});
  }, []);

  const filterGroups = [
    {
      id: "members",
      title: "Members",
      options: allUsers.map((u) => ({
        value: u._id,
        label: u.name,
        badge: u.role === "admin" ? "PM" : "Employee",
        avatarInitial: u.name?.[0]?.toUpperCase(),
        avatarColor: u.avatarColor || "#7C5CFF",
      })),
    },
  ];

  const isFiltered = filters.members && filters.members.length > 0;
  const filteredBoards = boards.filter((board) => {
    if (!isFiltered) return true;
    return board.members?.some((m) =>
      filters.members.includes(m.user?._id || m.user)
    );
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {user?.role === "admin" ? "Boards you manage" : "Boards you're a part of"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-start sm:self-auto">
          <FilterPopover
            groups={filterGroups}
            selected={filters}
            onChange={setFilters}
            onClear={() => setFilters({ members: [] })}
            align="right"
          />

          {user?.role === "admin" && (
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="bg-accent hover:bg-accent-dark active:bg-accent-dark text-white text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} className="shrink-0" />
              <span>New project</span>
            </button>
          )}
        </div>
      </div>

      {!loading && boards.length === 0 && (
        <div className="text-center py-16 sm:py-20 border border-dashed border-line rounded-xl sm:rounded-2xl bg-surface/30 px-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center text-muted mx-auto mb-3">
            <FolderKanban size={24} className="text-muted shrink-0" />
          </div>
          <p className="text-sm sm:text-base font-medium text-ink">No projects yet</p>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
            {user?.role === "admin"
              ? "Create your first project board to start assigning tasks and tracking progress."
              : "You haven't been added to any workspace projects yet."}
          </p>
          {user?.role === "admin" && (
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="mt-4 bg-accent hover:bg-accent-dark text-white text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus size={15} className="shrink-0" />
              <span>Create project</span>
            </button>
          )}
        </div>
      )}

      {!loading && boards.length > 0 && filteredBoards.length === 0 && (
        <div className="text-center py-16 sm:py-20 border border-dashed border-line rounded-xl sm:rounded-2xl bg-surface/30 px-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center text-muted mx-auto mb-3">
            <Filter size={24} className="text-muted shrink-0" />
          </div>
          <p className="text-sm sm:text-base font-medium text-ink">No projects match your filters</p>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
            None of your projects include the selected members.
          </p>
          <button
            type="button"
            onClick={() => setFilters({ members: [] })}
            className="mt-4 bg-accent hover:bg-accent-dark text-white text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shadow-sm cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredBoards.map((board) => (
          <Link
            key={board._id}
            to={`/boards/${board._id}`}
            className="group rounded-xl sm:rounded-2xl border border-line bg-surface overflow-hidden hover:border-accent/50 active:scale-[0.99] transition-all duration-150 shadow-card flex flex-col"
          >
            <div
              className="h-20 sm:h-24 relative transition-transform duration-300 group-hover:scale-105 origin-top"
              style={{ background: boardGradient(board.color) }}
            />
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-ink group-hover:text-accent-light transition-colors break-words">
                  {board.title}
                </h3>
                {board.description && (
                  <p className="text-xs sm:text-sm text-muted mt-1 line-clamp-2 leading-relaxed">
                    {board.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-line/50">
                <div className="flex items-center -space-x-1.5">
                  {board.members?.slice(0, 5).map((m) => (
                    <span
                      key={m.user._id}
                      title={m.user.name}
                      className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] text-white font-semibold shadow-sm"
                      style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
                    >
                      {m.user.name?.[0]?.toUpperCase()}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-muted font-medium flex items-center gap-1 group-hover:text-ink transition-colors">
                  <span>Open board</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={load} />
      )}
    </div>
  );
}
