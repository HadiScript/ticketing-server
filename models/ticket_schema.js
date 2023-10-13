const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Reopened"],
    default: "Open",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pickedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pickedAt: { type: Date }, // Timestamp when ticket is picked up
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  images: [{ type: String }],

  movements: [
    {
      yes: { type: Boolean, default: false },
      status: { type: String }, //escalated or handover
      why: { type: String },
      movedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      escalatedAt: { type: Date, default: Date.now }, // Timestamp when escalated
    },
  ],
  reopenCount: { type: Number, default: 0 },
  firstSLABreach: { type: Boolean, default: false },
  secondSLABreach: { type: Boolean, default: false },
  pickupSLATime: { type: Number, default: 10 }, // SLA time for pickup in minutes
  responseSLATime: { type: Number, default: 10 }, // SLA time for first response in minutes
  firstRespondedAt: { type: Date }, // Timestamp for the first response
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
