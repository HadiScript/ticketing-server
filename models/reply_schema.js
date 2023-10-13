const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
});

module.exports = mongoose.model("Reply", replySchema);
