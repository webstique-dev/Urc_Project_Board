import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BoardView from "./pages/BoardView.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import Navbar from "./components/Navbar.jsx";
import ProjectSwitcherBar from "./components/ProjectSwitcherBar.jsx";

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const FullScreenLoader = () => (
  <div className="h-screen flex items-center justify-center text-muted bg-base">
    Loading…
  </div>
);

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-base">
      {user && <Navbar />}
      <div className={user ? "pb-14" : ""}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<Private><Dashboard /></Private>} />
          <Route path="/my-tasks" element={<Private><MyTasks /></Private>} />
          <Route path="/boards/:id" element={<Private><BoardView /></Private>} />
        </Routes>
      </div>
      {user && <ProjectSwitcherBar />}
    </div>
  );
}
