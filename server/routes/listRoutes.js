import express from "express";
import {
  getListsForBoard,
  createList,
  updateList,
  deleteList,
  reorderLists,
} from "../controllers/listController.js";
import { protect, boardMember } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/board/:boardId", boardMember, getListsForBoard);
router.post("/", (req, res, next) => { req.params.boardId = req.body.board; next(); }, boardMember, createList);
router.patch("/reorder", reorderLists);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);

export default router;
