import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center gap-1.5 overflow-x-auto">
          {boards.map((board) => {
            const active = board._id === activeBoardId;
            return (
              <button
                key={board._id}
                onClick={() => navigate(`/boards/${board._id}`)}
                className={`flex items-center gap-1.5 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  active
                    ? "bg-accent/15 text-accent-light"
                    : "text-muted hover:text-ink hover:bg-white/5"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: board.color || "#7C5CFF" }}
                />
                {board.title}
              </button>
            );
          })}

          {user?.role === "admin" && (
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-1 shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg text-muted hover:text-accent-light hover:bg-accent/10 transition-colors ml-1 border border-dashed border-line"
            >
              + Add project
            </button>
          )}
        </div>
      </div>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={load} />
      )}
    </>
  );
}
