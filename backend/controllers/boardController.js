import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";

// GET /api/boards - boards the logged-in user belongs to (or all, if admin)
export const getBoards = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ createdBy: req.user._id }, { "members.user": req.user._id }] };

    const boards = await Board.find({ ...filter, archived: false })
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatarColor")
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/boards/:id
export const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatarColor");
    if (!board) return res.status(404).json({ message: "Board not found" });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/boards  (admin/PM only)
export const createBoard = async (req, res) => {
  try {
    const { title, description, color } = req.body;
    const board = await Board.create({
      title,
      description,
      color,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "manager" }],
    });

    // Seed default lists like a real Trello project
    const defaultLists = ["To Do", "In Progress", "Review", "Done"];
    await List.insertMany(
      defaultLists.map((title, i) => ({ title, board: board._id, order: i }))
    );

    const populated = await board.populate("members.user", "name email avatarColor");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id
export const updateBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/boards/:id
export const deleteBoard = async (req, res) => {
  try {
    await Card.deleteMany({ board: req.params.id });
    await List.deleteMany({ board: req.params.id });
    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: "Board deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/boards/:id/members  { userId, role }
export const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const already = board.members.some((m) => m.user.equals(userId));
    if (already) return res.status(400).json({ message: "User already a member" });

    board.members.push({ user: userId, role: role === "manager" ? "manager" : "member" });
    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/boards/:id/members/:userId
export const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    board.members = board.members.filter((m) => !m.user.equals(req.params.userId));
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
