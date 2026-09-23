import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LayoutGrid,
  CheckSquare,
  LogOut,
  Users,
  ChevronDown,
  Shield,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useBoardHeader } from "../context/BoardHeaderContext.jsx";
import FilterPopover from "./ui/FilterPopover.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { boardHeaderData } = useBoardHeader();

  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleConfirmLogout = () => {
    setShowSignoutModal(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    toast.info("Signed out successfully", { title: "Goodbye" });
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Check if we are currently on a board page with active board data
  const isBoardView = location.pathname.startsWith("/boards/") && !!boardHeaderData?.board;
  const board = boardHeaderData?.board;
  const members = board?.members || [];
  const maxVisibleAvatars = 4;
  const visibleMembers = members.slice(0, maxVisibleAvatars);
  const extraMembersCount = Math.max(0, members.length - maxVisibleAvatars);

  return (
    <>
      <header className="border-b border-line bg-surface/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-xs">
        <div className="w-full px-3 sm:px-5 lg:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4 max-w-[1700px] mx-auto">
          {/* ================= LEFT SECTION ================= */}
          <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 min-w-0 flex-1 sm:flex-initial">
            {/* Logo */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/40 rounded-lg group shrink-0"
              title="URC Building Values - Home"
            >
              <img
                src="/Urc_logo.svg"
                alt="URC Building Values"
                className="h-7 sm:h-8 w-auto object-contain transition-transform duration-150 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-medium shrink-0">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                  location.pathname === "/"
                    ? "text-accent bg-accent/10 font-semibold"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                Projects
              </Link>
              <Link
                to="/my-tasks"
                className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                  location.pathname === "/my-tasks"
                    ? "text-accent bg-accent/10 font-semibold"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                My tasks
              </Link>
            </nav>

            {/* If inside Board View: Divider + Project Name & Description */}
            {isBoardView && (
              <>
                {/* Subtle vertical divider */}
                <div className="hidden md:block w-px h-6 bg-line/80 shrink-0" />

                {/* Project Details */}
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h1
                      className="text-xs sm:text-sm lg:text-base font-bold text-ink tracking-tight truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[320px] xl:max-w-[420px]"
                      title={board.title}
                    >
                      {board.title}
                    </h1>
                  </div>
                  {board.description ? (
                    <p
                      className="text-[11px] text-muted truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[320px] xl:max-w-[420px] leading-tight"
                      title={board.description}
                    >
                      {board.description}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* ================= RIGHT SECTION ================= */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Board Controls (Visible on Desktop / Tablet when on Board) */}
            {isBoardView && (
              <div className="hidden sm:flex items-center gap-2 lg:gap-2.5">
                {/* Filter Popover */}
                {boardHeaderData.filterGroups && (
                  <FilterPopover
                    groups={boardHeaderData.filterGroups}
                    selected={boardHeaderData.filters}
                    onChange={boardHeaderData.setFilters}
                    onClear={() =>
                      boardHeaderData.setFilters({
                        members: [],
                        priority: [],
                        dueDate: [],
                        labels: [],
                      })
                    }
                    align="right"
                    buttonClassName="h-8.5 text-xs font-medium bg-surface hover:bg-surface-2 text-ink border border-line shadow-xs rounded-lg px-2.5 sm:px-3"
                  />
                )}

                {/* Project Member Avatars */}
                {members.length > 0 && (
                  <div
                    className="flex items-center -space-x-1.5 hover:space-x-0.5 transition-all duration-200 pl-1"
                    title={`${members.length} team member${members.length === 1 ? "" : "s"}`}
                  >
                    {visibleMembers.map((m) => (
                      <span
                        key={m.user._id || m._id}
                        title={`${m.user.name} (${m.role === "manager" ? "Manager" : "Member"})`}
                        className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[11px] text-white font-semibold shadow-xs transition-transform hover:scale-110 hover:z-10 cursor-default"
                        style={{ backgroundColor: m.user.avatarColor || "#0C66E4" }}
                      >
                        {m.user.name?.[0]?.toUpperCase()}
                      </span>
                    ))}
                    {extraMembersCount > 0 && (
                      <span
                        title={`${extraMembersCount} more members`}
                        className="w-7 h-7 rounded-full border-2 border-surface bg-surface-3 flex items-center justify-center text-[10px] text-ink font-bold shadow-xs cursor-default"
                      >
                        +{extraMembersCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Manage Team Button */}
                {boardHeaderData.isManager && (
                  <button
                    type="button"
                    onClick={boardHeaderData.onManageTeam}
                    className="btn-press h-8.5 text-xs font-medium text-ink bg-surface hover:bg-surface-2 border border-line shadow-xs rounded-lg px-2.5 sm:px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 flex items-center gap-1.5 cursor-pointer select-none"
                    title="Manage team members & roles"
                  >
                    <Users size={13} className="shrink-0 text-muted" />
                    <span className="hidden lg:inline">Manage team</span>
                    <span className="lg:hidden">Team</span>
                  </button>
                )}

                {/* Vertical Divider before Profile */}
                <div className="w-px h-6 bg-line/80 ml-0.5 shrink-0" />
              </div>
            )}

            {/* ================= USER PROFILE DROPDOWN (Desktop & Tablet) ================= */}
            <div className="relative hidden md:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer select-none ${
                  profileDropdownOpen
                    ? "bg-surface-2 border-line/80 ring-2 ring-accent/30"
                    : "hover:bg-surface-2/70 border-transparent hover:border-line/60"
                }`}
              >
                {/* Avatar Badge */}
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs ring-1 ring-white/20"
                  style={{ backgroundColor: user?.avatarColor || "#B45309" }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>

                {/* User Name */}
                <span className="text-xs sm:text-sm font-medium text-ink max-w-[120px] lg:max-w-[150px] truncate">
                  {user?.name}
                </span>

                {/* Role Pill */}
                {user?.role === "admin" && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold border border-amber-500/20">
                    PM
                  </span>
                )}

                {/* Chevron */}
                <ChevronDown
                  size={14}
                  className={`text-muted transition-transform duration-200 ${
                    profileDropdownOpen ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-line shadow-pop p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-ink"
                >
                  {/* Header: User Info Card */}
                  <div className="px-3 py-2.5 bg-surface-2/60 rounded-xl mb-1 flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: user?.avatarColor || "#B45309" }}
                    >
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-semibold text-ink truncate">
                          {user?.name}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted truncate">{user?.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                        <Shield size={10} className="text-accent" />
                        <span className="capitalize">{user?.role === "admin" ? "Project Manager (Admin)" : "Team Member"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links inside dropdown for convenience */}
                  <div className="py-1">
                    <Link
                      to="/"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        location.pathname === "/"
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-ink hover:bg-surface-2"
                      }`}
                    >
                      <Briefcase size={14} className="text-muted" />
                      <span>Projects</span>
                    </Link>
                    <Link
                      to="/my-tasks"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        location.pathname === "/my-tasks"
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-ink hover:bg-surface-2"
                      }`}
                    >
                      <CheckSquare size={14} className="text-muted" />
                      <span>My tasks</span>
                    </Link>
                  </div>

                  <div className="border-t border-line/60 my-1" />

                  {/* Sign Out Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowSignoutModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={14} className="shrink-0" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* ================= MOBILE / COMPACT TOGGLES ================= */}
            {/* Quick Filter toggle on mobile if on board */}
            {isBoardView && boardHeaderData.filterGroups && (
              <div className="sm:hidden">
                <FilterPopover
                  groups={boardHeaderData.filterGroups}
                  selected={boardHeaderData.filters}
                  onChange={boardHeaderData.setFilters}
                  onClear={() =>
                    boardHeaderData.setFilters({
                      members: [],
                      priority: [],
                      dueDate: [],
                      labels: [],
                    })
                  }
                  align="right"
                  buttonText=""
                  buttonClassName="h-8 w-8 !p-0 justify-center bg-surface hover:bg-surface-2 text-ink border border-line shadow-xs rounded-lg"
                />
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-9 h-9 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ================= MOBILE SLIDE-DOWN DRAWER ================= */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-surface/98 backdrop-blur-md px-4 py-3 space-y-3 shadow-pop animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
            {/* User identity card */}
            <div className="flex items-center justify-between py-2 px-1 border-b border-line/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                  style={{ backgroundColor: user?.avatarColor || "#B45309" }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-ink truncate">
                      {user?.name}
                    </span>
                    {user?.role === "admin" && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 font-bold border border-amber-500/20">
                        PM
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted truncate max-w-[200px]">{user?.email}</span>
                </div>
              </div>
            </div>

            {/* If viewing a board on mobile, show board title + team management options */}
            {isBoardView && (
              <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line/60 space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Current Project</span>
                  <p className="text-xs font-bold text-ink truncate">{board.title}</p>
                  {board.description && (
                    <p className="text-[11px] text-muted line-clamp-2 mt-0.5">{board.description}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-line/40 flex items-center justify-between">
                  <div className="flex items-center -space-x-1.5">
                    {visibleMembers.map((m) => (
                      <span
                        key={m.user._id || m._id}
                        title={m.user.name}
                        className="w-6 h-6 rounded-full border border-surface flex items-center justify-center text-[10px] text-white font-semibold shadow-xs"
                        style={{ backgroundColor: m.user.avatarColor || "#0C66E4" }}
                      >
                        {m.user.name?.[0]?.toUpperCase()}
                      </span>
                    ))}
                    {extraMembersCount > 0 && (
                      <span className="w-6 h-6 rounded-full border border-surface bg-surface-3 flex items-center justify-center text-[9px] text-ink font-bold shadow-xs">
                        +{extraMembersCount}
                      </span>
                    )}
                  </div>

                  {boardHeaderData.isManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        boardHeaderData.onManageTeam?.();
                      }}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Users size={12} />
                      <span>Manage team</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                <LayoutGrid size={16} />
                <span>Projects</span>
              </Link>
              <Link
                to="/my-tasks"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  location.pathname === "/my-tasks"
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                <CheckSquare size={16} />
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
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
