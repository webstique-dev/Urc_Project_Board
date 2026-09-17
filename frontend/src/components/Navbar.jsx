import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white text-xs font-semibold">
              B
            </span>
            <span className="font-medium text-ink text-sm">Workspace</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted">
            <Link to="/" className="hover:text-ink transition-colors">Projects</Link>
            <Link to="/my-tasks" className="hover:text-ink transition-colors">My tasks</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: user?.avatarColor || "#7C5CFF" }}
            title={user?.name}
          >
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <span className="text-sm text-ink/80 hidden sm:inline">{user?.name}</span>
          {user?.role === "admin" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-light font-medium">
              PM
            </span>
          )}
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-muted hover:text-ink transition-colors ml-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
