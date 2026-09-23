import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

// Non-blocking background socket connection per board view
export const useSocket = (boardId, handlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!boardId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 6000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    // Join room when connected (or reconnected)
    socket.on("connect", () => {
      socket.emit("board:join", boardId);
    });

    // If socket is already connected immediately
    if (socket.connected) {
      socket.emit("board:join", boardId);
    }

    // Dynamic event dispatcher referencing fresh handler functions
    const eventNames = ["lists:changed", "card:changed", "board:changed"];
    eventNames.forEach((event) => {
      socket.on(event, (data) => {
        handlersRef.current[event]?.(data);
      });
    });

    return () => {
      try {
        if (socket.connected) {
          socket.emit("board:leave", boardId);
        }
        socket.disconnect();
      } catch (err) {
        // Safe cleanup
      }
    };
  }, [boardId]);

  const emitAction = useCallback(
    (event, payload) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("board:action", { boardId, event, payload });
      }
    },
    [boardId]
  );

  return { emitAction };
};
