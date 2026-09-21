import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LayoutGrid, CheckSquare, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleConfirmLogout = () => {
    setShowSignoutModal(false);
    setMobileMenuOpen(false);
    logout();
    toast.info("Signed out successfully", { title: "Goodbye" });
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="border-b border-line bg-surface/95 backdrop-blur-sm sticky top-0 z-40 transition-colors shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-accent/40 rounded-lg group"
            >
              <img
                src="/Urc_logo.svg"
                alt="URC Building Values"
                className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              {/* <span className="font-semibold text-ink text-sm sm:text-base tracking-tight">
                URC Building Values
              </span> */}
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition-colors ${location.pathname === "/" ? "text-ink bg-surface-2 font-semibold" : "hover:text-ink hover:bg-surface-2/60"
                  }`}
              >
                Projects
              </Link>
              <Link
                to="/my-tasks"
                className={`px-3 py-1.5 rounded-lg transition-colors ${location.pathname === "/my-tasks" ? "text-ink bg-surface-2 font-semibold" : "hover:text-ink hover:bg-surface-2/60"
                  }`}
              >
                My tasks
              </Link>
            </nav>
          </div>

          {/* Desktop User Info & Sign Out */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm"
                style={{ backgroundColor: user?.avatarColor || "#B45309" }}
                title={user?.name}
              >
                {user?.name?.[0]?.toUpperCase()}
              </span>
              <span className="text-sm font-medium text-ink max-w-[150px] truncate">{user?.name}</span>
              {user?.role === "admin" && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-3 text-ink font-semibold">
                  PM
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSignoutModal(true)}
              className="text-xs font-medium text-muted hover:text-ink hover:bg-surface-2 px-2.5 py-1.5 rounded-lg transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-accent/40 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} className="shrink-0" />
              <span>Sign out</span>
            </button>
          </div>

          {/* Mobile Right Bar: Avatar + Hamburger Toggle (Min 44x44px touch targets) */}
          <div className="flex md:hidden items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
              style={{ backgroundColor: user?.avatarColor || "#B45309" }}
              title={user?.name}
            >
              {user?.name?.[0]?.toUpperCase()}
            </span>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="w-10 h-10 -mr-2 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Below MD */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-surface/98 backdrop-blur-md px-4 py-3 space-y-3 shadow-pop animate-in slide-in-from-top-2 duration-150">
            {/* User Identity on Mobile */}
            <div className="flex items-center justify-between py-2 px-1 border-b border-line/60">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: user?.avatarColor || "#B45309" }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink">{user?.name}</span>
                  <span className="text-xs text-muted truncate max-w-[200px]">{user?.email}</span>
                </div>
              </div>
              {user?.role === "admin" && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-3 text-ink font-semibold">
                  PM
                </span>
              )}
            </div>

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === "/"
                    ? "bg-surface-2 text-ink font-semibold"
                    : "text-muted hover:text-ink hover:bg-surface-2/60"
                  }`}
              >
                <LayoutGrid size={18} />
                <span>Projects</span>
              </Link>
              <Link
                to="/my-tasks"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === "/my-tasks"
                    ? "bg-surface-2 text-ink font-semibold"
                    : "text-muted hover:text-ink hover:bg-surface-2/60"
                  }`}
              >
                <CheckSquare size={18} />
                <span>My tasks</span>
              </Link>
            </nav>

            {/* Mobile Logout Button */}
            <div className="pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSignoutModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <ConfirmationModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Sign out"
        message="Are you sure you want to sign out of your URC Building Values session?"
        confirmText="Sign out"
        cancelText="Stay signed in"
        variant="destructive"
      />
    </>
  );
}
