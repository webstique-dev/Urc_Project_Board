import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { boardGradient } from "../utils/color.js";
import NewProjectModal from "../components/NewProjectModal.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/boards").then((res) => setBoards(res.data));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Projects</h1>
          <p className="text-sm text-muted mt-1">
            {user?.role === "admin" ? "Boards you manage" : "Boards you're a part of"}
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            + New project
          </button>
        )}
      </div>

      {!loading && boards.length === 0 && (
        <div className="text-center py-20 border border-dashed border-line rounded-xl">
          <p className="text-muted">
            {user?.role === "admin"
              ? "No projects yet — create your first board above."
              : "You haven't been added to any projects yet."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => (
          <Link
            key={board._id}
            to={`/boards/${board._id}`}
            className="group rounded-xl border border-line bg-surface overflow-hidden hover:border-accent/40 transition-colors"
          >
            <div
              className="h-20 relative"
              style={{ background: boardGradient(board.color) }}
            />
            <div className="p-4">
              <h3 className="font-medium text-ink group-hover:text-accent-light transition-colors">
                {board.title}
              </h3>
              {board.description && (
                <p className="text-sm text-muted mt-1 line-clamp-2">{board.description}</p>
              )}
              <div className="flex items-center mt-4 -space-x-2">
                {board.members?.slice(0, 5).map((m) => (
                  <span
                    key={m.user._id}
                    title={m.user.name}
                    className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[10px] text-white font-medium"
                    style={{ backgroundColor: m.user.avatarColor || "#7C5CFF" }}
                  >
                    {m.user.name?.[0]?.toUpperCase()}
                  </span>
                ))}
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
