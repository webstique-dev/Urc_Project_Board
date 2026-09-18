import express from "express";
import {
  createCard,
  getCard,
  updateCard,
  moveCard,
  deleteCard,
  addComment,
  updateComment,
  deleteComment,
  addAttachment,
  deleteAttachment,
  getMyCards,
} from "../controllers/cardController.js";
import { protect, boardMember } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/mine", getMyCards);
router.post(
  "/",
  (req, res, next) => {
    req.params.boardId = req.body.board;
    next();
  },
  boardMember,
  createCard
);
router.get("/:id", getCard);
router.patch("/:id", updateCard);
router.patch("/:id/move", moveCard);
router.delete("/:id", deleteCard);

// Comments routes
router.post("/:id/comments", addComment);
router.patch("/:id/comments/:commentId", updateComment);
router.delete("/:id/comments/:commentId", deleteComment);

// Attachments routes
router.post("/:id/attachments", addAttachment);
router.delete("/:id/attachments/:attachmentId", deleteAttachment);

export default router;
