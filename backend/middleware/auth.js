import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Board from "../models/Board.js";

// Verifies JWT and attaches req.user
export const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer")) {
    try {
      token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ message: "User not found" });
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

// Restrict a route to global admins (company-wide PM role)
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

// Ensure the logged-in user is a member of the board in the URL (:boardId or via body.board)
export const boardMember = async (req, res, next) => {
  const boardId = req.params.boardId || req.body.board || req.params.id;
  const board = await Board.findById(boardId);
  if (!board) return res.status(404).json({ message: "Board not found" });

  const isMember =
    req.user.role === "admin" ||
    board.createdBy.equals(req.user._id) ||
    board.members.some((m) => m.user.equals(req.user._id));

  if (!isMember) return res.status(403).json({ message: "Not a member of this board" });

  req.board = board;
  next();
};

// Ensure the logged-in user is a "manager" on the board (can add/remove members, delete board)
export const boardManager = async (req, res, next) => {
  const board = req.board || (await Board.findById(req.params.boardId || req.params.id));
  if (!board) return res.status(404).json({ message: "Board not found" });

  const isManager =
    req.user.role === "admin" ||
    board.createdBy.equals(req.user._id) ||
    board.members.some((m) => m.user.equals(req.user._id) && m.role === "manager");

  if (!isManager) return res.status(403).json({ message: "Manager access required" });
  next();
};
