import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    list: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
    order: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dueDate: { type: Date },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    labels: [{ type: String }],
    checklist: [
      {
        text: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
    attachments: [
      {
        type: { type: String, enum: ["link"], default: "link" },
        url: { type: String, required: true },
        label: { type: String, default: "" },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        editedAt: { type: Date },
      },
    ],
    activityLog: [
      {
        action: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        meta: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Card", cardSchema);
