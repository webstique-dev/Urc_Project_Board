import List from "../models/List.js";
import Card from "../models/Card.js";

// GET /api/boards/:boardId/lists  - lists + their cards, board layout
export const getListsForBoard = async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId }).sort({ order: 1 });
    const cards = await Card.find({ board: req.params.boardId })
      .populate("assignees", "name email avatarColor")
      .sort({ order: 1 });

    const listsWithCards = lists.map((list) => ({
      ...list.toObject(),
      cards: cards.filter((c) => c.list.equals(list._id)),
    }));

    res.json(listsWithCards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lists  { title, board }
export const createList = async (req, res) => {
  try {
    const { title, board } = req.body;
    const count = await List.countDocuments({ board });
    const list = await List.create({ title, board, order: count });
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/lists/:id  { title?, order? }
export const updateList = async (req, res) => {
  try {
    const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lists/:id
export const deleteList = async (req, res) => {
  try {
    await Card.deleteMany({ list: req.params.id });
    await List.findByIdAndDelete(req.params.id);
    res.json({ message: "List deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/lists/reorder  { boardId, orderedListIds: [id1, id2, ...] }
export const reorderLists = async (req, res) => {
  try {
    const { orderedListIds } = req.body;
    await Promise.all(
      orderedListIds.map((id, index) => List.findByIdAndUpdate(id, { order: index }))
    );
    res.json({ message: "Lists reordered" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
