import mongoose from "mongoose";
import Card from "../models/Card.js";
import List from "../models/List.js";

const populateCard = (query) =>
  query
    .populate("assignees", "name email avatarColor")
    .populate("comments.user", "name avatarColor role")
    .populate("attachments.addedBy", "name avatarColor role")
    .populate("activityLog.user", "name avatarColor role")
    .populate("list", "title");

// POST /api/cards  { title, board, list }
export const createCard = async (req, res) => {
  try {
    const { title, board, list } = req.body;
    const count = await Card.countDocuments({ list });
    const targetList = await List.findById(list);

    const card = await Card.create({
      title,
      board,
      list,
      order: count,
      createdBy: req.user._id,
      activityLog: [
        {
          action: "created",
          user: req.user._id,
          meta: { listTitle: targetList?.title || "list" },
          timestamp: new Date(),
        },
      ],
    });

    const populated = await populateCard(Card.findById(card._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/cards/:id
export const getCard = async (req, res) => {
  try {
    const card = await populateCard(Card.findById(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/cards/:id  - general field updates
export const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    // Track activity log entries
    const updates = req.body;
    const activities = [];

    if (updates.completed !== undefined && updates.completed !== card.completed) {
      activities.push({
        action: updates.completed ? "completed" : "uncompleted",
        user: req.user._id,
        timestamp: new Date(),
      });
    }

    if (updates.priority !== undefined && updates.priority !== card.priority) {
      activities.push({
        action: "priority_changed",
        user: req.user._id,
        meta: { from: card.priority, to: updates.priority },
        timestamp: new Date(),
      });
    }

    if (updates.dueDate !== undefined) {
      const oldDue = card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : null;
      const newDue = updates.dueDate ? new Date(updates.dueDate).toISOString().slice(0, 10) : null;
      if (oldDue !== newDue) {
        activities.push({
          action: "due_date_changed",
          user: req.user._id,
          meta: { dueDate: updates.dueDate },
          timestamp: new Date(),
        });
      }
    }

    if (updates.labels !== undefined) {
      const oldLabels = (card.labels || []).slice().sort().join(",");
      const newLabels = (updates.labels || []).slice().sort().join(",");
      if (oldLabels !== newLabels) {
        activities.push({
          action: "labels_changed",
          user: req.user._id,
          meta: { labels: updates.labels },
          timestamp: new Date(),
        });
      }
    }

    if (updates.assignees !== undefined) {
      const oldAssignees = (card.assignees || []).map((a) => a.toString()).sort().join(",");
      const newAssignees = (updates.assignees || []).map((a) => a.toString()).sort().join(",");
      if (oldAssignees !== newAssignees) {
        activities.push({
          action: "assignees_changed",
          user: req.user._id,
          timestamp: new Date(),
        });
      }
    }

    if (updates.checklists && Array.isArray(updates.checklists)) {
      updates.checklists = updates.checklists.map((cl) => {
        const cleanCl = {
          title: cl.title || "Checklist",
          items: (cl.items || []).map((it) => {
            const cleanItem = {
              text: it.text,
              done: Boolean(it.done),
            };
            if (it._id && mongoose.Types.ObjectId.isValid(it._id) && String(it._id) !== "legacy") {
              cleanItem._id = it._id;
            }
            return cleanItem;
          }),
        };
        if (cl._id && mongoose.Types.ObjectId.isValid(cl._id) && String(cl._id) !== "legacy") {
          cleanCl._id = cl._id;
        }
        return cleanCl;
      });
    }

    // Apply updates
    Object.assign(card, updates);
    if (activities.length > 0) {
      card.activityLog.push(...activities);
    }

    await card.save();
    const populated = await populateCard(Card.findById(card._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/cards/:id/move  { list, order }
export const moveCard = async (req, res) => {
  try {
    const { list, order } = req.body;
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    if (list && list.toString() !== card.list.toString()) {
      const [oldList, newList] = await Promise.all([
        List.findById(card.list),
        List.findById(list),
      ]);

      card.activityLog.push({
        action: "moved",
        user: req.user._id,
        meta: {
          fromList: oldList?.title || "list",
          toList: newList?.title || "list",
        },
        timestamp: new Date(),
      });
      card.list = list;
    }

    if (order !== undefined) {
      card.order = order;
    }

    await card.save();
    const populated = await populateCard(Card.findById(card._id));
    res.json(populated);
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
    if (!card) return res.status(404).json({ message: "Card not found" });

    card.comments.push({
      user: req.user._id,
      text: req.body.text,
      createdAt: new Date(),
    });

    card.activityLog.push({
      action: "comment_added",
      user: req.user._id,
      timestamp: new Date(),
    });

    await card.save();
    const populated = await populateCard(Card.findById(card._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/cards/:id/comments/:commentId  { text }
export const updateComment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const comment = card.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = req.body.text;
    comment.editedAt = new Date();

    await card.save();
    const populated = await populateCard(Card.findById(card._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cards/:id/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const comment = card.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    card.comments.pull({ _id: req.params.commentId });
    await card.save();

    const populated = await populateCard(Card.findById(card._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cards/:id/attachments  { url, label }
export const addAttachment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const { url, label } = req.body;
    if (!url) return res.status(400).json({ message: "URL is required" });

    const attachment = {
      type: "link",
      url,
      label: label || url,
      addedBy: req.user._id,
      createdAt: new Date(),
    };

    card.attachments.push(attachment);
    card.activityLog.push({
      action: "attachment_added",
      user: req.user._id,
      meta: { label: attachment.label, url },
      timestamp: new Date(),
    });

    await card.save();
    const populated = await populateCard(Card.findById(card._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/cards/:id/attachments/upload (multipart/form-data with file)
export const uploadFileAttachment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const displayName = req.body.label || req.file.originalname;

    const attachment = {
      type: "file",
      url: fileUrl,
      label: displayName,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      addedBy: req.user._id,
      createdAt: new Date(),
    };

    card.attachments.push(attachment);
    card.activityLog.push({
      action: "attachment_added",
      user: req.user._id,
      meta: { label: attachment.label, url: fileUrl, originalName: req.file.originalname },
      timestamp: new Date(),
    });

    await card.save();
    const populated = await populateCard(Card.findById(card._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/cards/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const attachment = card.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    const isAuthor = attachment.addedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isAuthor && !isAdmin && attachment.addedBy) {
      return res.status(403).json({ message: "Not authorized to remove this attachment" });
    }

    card.attachments.pull({ _id: req.params.attachmentId });
    await card.save();

    const populated = await populateCard(Card.findById(card._id));
    res.json(populated);
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
