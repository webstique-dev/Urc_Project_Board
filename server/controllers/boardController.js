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
      .populate("members.user", "name email avatarColor role")
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const DEFAULT_LABELS = [
  { name: "Planning", color: "#0284c7" },
  { name: "Site Work", color: "#d97706" },
  { name: "Structural", color: "#57534e" },
  { name: "Electrical", color: "#ca8a04" },
  { name: "Plumbing", color: "#0891b2" },
  { name: "Procurement", color: "#9333ea" },
  { name: "Safety", color: "#e11d48" },
  { name: "Inspection", color: "#059669" },
];

// GET /api/boards/:id
export const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatarColor role");
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Initialize default labels if empty
    if (!board.labels || board.labels.length === 0) {
      board.labels = DEFAULT_LABELS;
      await board.save();
    }

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
      labels: DEFAULT_LABELS,
    });

    // Seed default lists like a real Trello project
    const defaultLists = ["To Do", "In Progress", "Review", "Done"];
    await List.insertMany(
      defaultLists.map((title, i) => ({ title, board: board._id, order: i }))
    );

    const populated = await board.populate("members.user", "name email avatarColor role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id
export const updateBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatarColor role");
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
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id/members/:userId  { role: "manager" | "member" }
export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["manager", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'manager' or 'member'" });
    }

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const memberIndex = board.members.findIndex((m) => m.user.equals(req.params.userId));
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found on this board" });
    }

    const currentRole = board.members[memberIndex].role;
    if (currentRole === "manager" && role === "member") {
      const managerCount = board.members.filter((m) => m.role === "manager").length;
      if (managerCount <= 1) {
        return res.status(400).json({
          message: "Assign another manager before demoting this one",
        });
      }
    }

    board.members[memberIndex].role = role;
    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
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

    const member = board.members.find((m) => m.user.equals(req.params.userId));
    if (!member) {
      return res.status(404).json({ message: "Member not found on this board" });
    }

    if (member.role === "manager") {
      const managerCount = board.members.filter((m) => m.role === "manager").length;
      if (managerCount <= 1) {
        return res.status(400).json({
          message: "Assign another manager before removing this one",
        });
      }
    }

    board.members = board.members.filter((m) => !m.user.equals(req.params.userId));
    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/boards/:id/labels  { name, color }
export const addBoardLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Label name is required" });
    }

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const trimmedName = name.trim();
    const existingIndex = (board.labels || []).findIndex(
      (l) => l.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex !== -1) {
      if (color) {
        board.labels[existingIndex].color = color;
      }
    } else {
      board.labels.push({ name: trimmedName, color: color || "#0284c7" });
    }

    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id/labels/:labelId  { name, color }
export const updateBoardLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const label = board.labels.id(req.params.labelId);
    if (!label) return res.status(404).json({ message: "Label not found" });

    const oldName = label.name;
    if (name && name.trim()) {
      label.name = name.trim();
    }
    if (color) {
      label.color = color;
    }

    await board.save();

    // If renamed, update cards on this board that used the old name
    if (name && name.trim() && name.trim() !== oldName) {
      await Card.updateMany(
        { board: board._id, labels: oldName },
        { $set: { "labels.$[elem]": name.trim() } },
        { arrayFilters: [{ elem: oldName }] }
      );
    }

    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/boards/:id/labels/:labelId
export const deleteBoardLabel = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const label = board.labels.id(req.params.labelId);
    if (!label) return res.status(404).json({ message: "Label not found" });

    board.labels.pull(req.params.labelId);
    await board.save();

    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

