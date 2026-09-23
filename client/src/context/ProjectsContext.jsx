import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightPromiseRef = useRef(null);

  const fetchBoards = useCallback(
    async (force = false, signal = null) => {
      if (!user) {
        setBoards([]);
        setLoading(false);
        return [];
      }

      // Deduplicate simultaneous requests: return existing in-flight promise if active
      if (inFlightPromiseRef.current && !force) {
        return inFlightPromiseRef.current;
      }

      setLoading(true);
      setError(null);

      const promise = api
        .get("/boards", { signal })
        .then((res) => {
          setBoards(res.data);
          setError(null);
          return res.data;
        })
        .catch((err) => {
          if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
            return [];
          }
          setError(err.response?.data?.message || "Failed to load projects");
          throw err;
        })
        .finally(() => {
          setLoading(false);
          inFlightPromiseRef.current = null;
        });

      inFlightPromiseRef.current = promise;
      return promise;
    },
    [user]
  );

  // Initial load when user becomes available
  useEffect(() => {
    if (!user) {
      setBoards([]);
      return;
    }
    const controller = new AbortController();
    fetchBoards(false, controller.signal).catch(() => {});
    return () => controller.abort();
  }, [user, fetchBoards]);

  return (
    <ProjectsContext.Provider
      value={{
        boards,
        setBoards,
        loading,
        error,
        fetchBoards,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
