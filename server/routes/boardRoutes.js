import express from "express";
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  updateMemberRole,
  removeMember,
  addBoardLabel,
  updateBoardLabel,
  deleteBoardLabel,
} from "../controllers/boardController.js";
import { protect, boardMember, boardManager } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getBoards);
router.post("/", createBoard);
router.get("/:id", boardMember, getBoard);
router.patch("/:id", boardMember, boardManager, updateBoard);
router.delete("/:id", boardMember, boardManager, deleteBoard);
router.post("/:id/members", boardMember, boardManager, addMember);
router.patch("/:id/members/:userId", boardMember, boardManager, updateMemberRole);
router.delete("/:id/members/:userId", boardMember, boardManager, removeMember);

// Board labels management
router.post("/:id/labels", boardMember, addBoardLabel);
router.patch("/:id/labels/:labelId", boardMember, updateBoardLabel);
router.delete("/:id/labels/:labelId", boardMember, deleteBoardLabel);

export default router;
