import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// One socket connection per board view. Joins the board's room, listens for
// broadcast events, and exposes `emitAction` for sending local changes out.
export const useSocket = (boardId, handlers) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!boardId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
    });
    socketRef.current = socket;
    socket.emit("board:join", boardId);

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      socket.emit("board:leave", boardId);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const emitAction = (event, payload) => {
    socketRef.current?.emit("board:action", { boardId, event, payload });
  };

  return { emitAction };
};
