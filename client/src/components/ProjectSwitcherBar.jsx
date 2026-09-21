import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import NewProjectModal from "./NewProjectModal.jsx";

// Persistent bottom bar: every project the user belongs to, as a tab.
// The current project (if any) is highlighted. Admins get a "+" to add
// a new project, which opens as a popup rather than navigating away.
export default function ProjectSwitcherBar() {
  const { id: activeBoardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);

  const load = () => api.get("/boards").then((res) => setBoards(res.data));

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2">
          {/* Scrollable Project Tabs */}
          <div
            tabIndex={0}
            aria-label="Project tabs"
            className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar scroll-smooth py-1 focus:outline-none focus:ring-1 focus:ring-accent/40 rounded-lg"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {boards.map((board) => {
              const active = board._id === activeBoardId;
              return (
                <button
                  key={board._id}
                  onClick={() => navigate(`/boards/${board._id}`)}
                  className={`flex items-center gap-1.5 shrink-0 text-xs font-medium px-3 py-2 sm:py-1.5 rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer ${
                    active
                      ? "bg-accent/10 text-accent font-semibold"
                      : "text-muted hover:text-ink hover:bg-slate-100 active:bg-slate-200"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: board.color || "#0C66E4" }}
                  />
                  <span className="max-w-[140px] sm:max-w-[200px] truncate">{board.title}</span>
                </button>
              );
            })}
          </div>

          {/* Sticky / Dedicated Add Project Button for PMs */}
          {user?.role === "admin" && (
            <div className="shrink-0 pl-1 border-l border-line/60">
              <button
                onClick={() => setShowNewProject(true)}
                aria-label="Add new project"
                className="flex items-center gap-1 shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg text-accent bg-accent/10 hover:bg-accent/15 border border-dashed border-accent/40 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
              >
                <Plus size={14} className="shrink-0" />
                <span className="hidden xs:inline sm:inline">Add project</span>
                <span className="xs:hidden sm:hidden">Project</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={load} />
      )}
    </>
  );
}
