import express from "express";
import {
  createCard,
  getCard,
  updateCard,
  moveCard,
  deleteCard,
  addComment,
  getMyCards,
} from "../controllers/cardController.js";
import { protect, boardMember } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/mine", getMyCards);
router.post("/", (req, res, next) => { req.params.boardId = req.body.board; next(); }, boardMember, createCard);
router.get("/:id", getCard);
router.patch("/:id", updateCard);
router.patch("/:id/move", moveCard);
router.delete("/:id", deleteCard);
router.post("/:id/comments", addComment);

export default router;
