import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#0F172A" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["manager", "member"], default: "member" },
      },
    ],
    labels: [
      {
        name: { type: String, required: true, trim: true },
        color: { type: String, default: "#0284c7" },
      },
    ],
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Board", boardSchema);
