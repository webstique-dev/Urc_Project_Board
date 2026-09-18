import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("List", listSchema);
