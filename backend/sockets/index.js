// Real-time layer. Each connected client joins a "room" per board they're
// viewing. When one user moves/edits a card or list, we broadcast the change
// to everyone else in that room so boards update live without a refresh.

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("board:join", (boardId) => {
      socket.join(boardId);
    });

    socket.on("board:leave", (boardId) => {
      socket.leave(boardId);
    });

    // Generic relay: client sends { boardId, event, payload } and we
    // broadcast `event` with `payload` to everyone else on that board.
    // Covers card:created, card:updated, card:moved, card:deleted,
    // list:created, list:updated, list:deleted, list:reordered, etc.
    socket.on("board:action", ({ boardId, event, payload }) => {
      socket.to(boardId).emit(event, payload);
    });

    socket.on("disconnect", () => {
      // no-op — rooms are cleaned up automatically
    });
  });
};
