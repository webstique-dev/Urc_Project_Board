import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { BoardHeaderProvider } from "./context/BoardHeaderContext.jsx";
import { ProjectsProvider } from "./context/ProjectsContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProjectSwitcherBar from "./components/ProjectSwitcherBar.jsx";
import Preloader from "./components/ui/Preloader.jsx";
import TopProgressBar from "./components/ui/TopProgressBar.jsx";
import ServerStatusBanner from "./components/ui/ServerStatusBanner.jsx";
import DashboardSkeleton from "./components/ui/DashboardSkeleton.jsx";

// Route-based code splitting: heavy libraries like @hello-pangea/dnd and react-day-picker
// are loaded on-demand only when their corresponding pages are requested.
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const BoardView = lazy(() => import("./pages/BoardView.jsx"));
const MyTasks = lazy(() => import("./pages/MyTasks.jsx"));

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Preloader fullScreen message="Authenticating session…" />;
  return user ? children : <Navigate to="/login" replace />;
};

// Lightweight in-page route suspense fallback to avoid full-screen flashing during normal navigation
const RouteFallback = () => (
  <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-100">
    <DashboardSkeleton />
  </div>
);

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Preloader fullScreen message="Starting URC Building Values…" />;
  }

  return (
    <BoardHeaderProvider>
      <ProjectsProvider>
        <div className="min-h-screen bg-base flex flex-col">
          <TopProgressBar />
          {user && <Navbar />}
          {user && <ServerStatusBanner />}
          <div className={`flex-1 ${user ? "pb-16 sm:pb-14 pb-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
                <Route path="/" element={<Private><Dashboard /></Private>} />
                <Route path="/my-tasks" element={<Private><MyTasks /></Private>} />
                <Route path="/boards/:id" element={<Private><BoardView /></Private>} />
              </Routes>
            </Suspense>
          </div>
          {user && <ProjectSwitcherBar />}
        </div>
      </ProjectsProvider>
    </BoardHeaderProvider>
  );
}
