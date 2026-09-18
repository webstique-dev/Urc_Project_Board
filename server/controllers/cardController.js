import Card from "../models/Card.js";

// POST /api/cards  { title, board, list }
export const createCard = async (req, res) => {
  try {
    const { title, board, list } = req.body;
    const count = await Card.countDocuments({ list });
    const card = await Card.create({
      title,
      board,
      list,
      order: count,
      createdBy: req.user._id,
    });
    const populated = await card.populate("assignees", "name email avatarColor");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/cards/:id
export const getCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate("assignees", "name email avatarColor")
      .populate("comments.user", "name avatarColor");
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/cards/:id  - general field updates (title, description, assignees, dueDate, priority, labels)
export const updateCard = async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("assignees", "name email avatarColor")
      .populate("comments.user", "name avatarColor");
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/cards/:id/move  { list, order }
// Used specifically by drag-and-drop: moves a card to a (possibly new) list/position
export const moveCard = async (req, res) => {
  try {
    const { list, order } = req.body;
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      { list, order },
      { new: true }
    ).populate("assignees", "name email avatarColor");
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cards/:id
export const deleteCard = async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cards/:id/comments  { text }
export const addComment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    card.comments.push({ user: req.user._id, text: req.body.text });
    await card.save();
    const populated = await card.populate("comments.user", "name avatarColor");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/cards/mine  - "My Tasks" view across all boards for the logged-in user
export const getMyCards = async (req, res) => {
  try {
    const cards = await Card.find({ assignees: req.user._id })
      .populate("board", "title color")
      .populate("list", "title")
      .sort({ dueDate: 1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
