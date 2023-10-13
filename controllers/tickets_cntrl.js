const Category = require("../models/category_schema");
const Ticket = require("../models/ticket_schema");
const User = require("../models/user_schema");
const sendError = require("../utils/Error");
const Comment = require("../models/comment_Schema");
const comment_Schema = require("../models/comment_Schema");
const reply_schema = require("../models/reply_schema");

const createTicketByClient = async (req, res) => {
  try {
    // Validate inputs
    const { title, description, category, priority, images } = req.body;

    if (!title || !description || !category || !priority) {
      return sendError(res, "All required fields must be filled", 400);
    }

    // Check if user exists
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "client") {
      return sendError(res, "Invalid user", 400);
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return sendError(res, "Invalid category", 400);
    }

    // Create new ticket
    const newTicket = new Ticket({
      title,
      description,
      category,
      priority,
      images: images || [],
      createdBy: req.user._id,
      status: "Open",
      createdAt: new Date(),
    });

    // Save the ticket
    await newTicket.save();

    // Send success response
    return res.status(201).json({
      ok: true,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return sendError(res);
  }
};

// for the first SLA
const pickTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return sendError(res, "Ticket ID and User ID are required", 400);
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return sendError(res, "Invalid ticket ID", 400);
    }

    if (ticket.pickedBy) {
      return sendError(res, "Ticket has already been picked", 400);
    }

    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "agent" && user.role !== "admin")) {
      return sendError(res, "Only agents or admins can pick tickets", 400);
    }

    // Check if the user's category matches the ticket's category
    if (user.category.toString() !== ticket.category.toString()) {
      return sendError(
        res,
        "User's category does not match the ticket's category",
        400
      );
    }

    // SLA Check
    const currentTime = new Date();
    const timeDifference = (currentTime - new Date(ticket.createdAt)) / 60000; // Difference in minutes

    if (timeDifference > 10) {
      ticket.firstSLABreach = true;
    }

    ticket.pickedBy = req.user._id;
    ticket.pickedAt = currentTime;
    ticket.status = "In Progress";
    await ticket.save();

    return res.status(200).json({
      message: "Ticket picked successfully",
      ticket: ticket,
    });
  } catch (error) {
    console.error("Error picking ticket:", error);
    return sendError(res);
  }
};

// for the second SLA
const addCommentToTicket = async (req, res) => {
  try {
    const { ticketId, content } = req.body;
    if (!ticketId || !content) {
      return sendError(
        res,
        "Ticket ID, User ID, and content are required",
        400
      );
    }

    const ticket = await Ticket.findById(ticketId).populate("comments");
    if (!ticket) {
      return sendError(res, "Invalid ticket ID", 400);
    }

    const user = await User.findById(req.user._id);
    if (!user || (user.role !== "agent" && user.role !== "admin")) {
      return sendError(res, "Only agents or admins can add comments", 400);
    }

    // Check for the second SLA breach
    if (!ticket.firstRespondedAt) {
      ticket.firstRespondedAt = new Date();
      const timeDifference =
        (ticket.firstRespondedAt - new Date(ticket.createdAt)) / 60000; // Difference in minutes

      if (timeDifference > 1) {
        ticket.secondSLABreach = true;
      }
    }

    // Create a new comment
    const newComment = new Comment({
      content,
      createdBy: req.user._id,
      createdAt: new Date(),
    });
    const _comment = await newComment.save();

    // Add  the comment to the ticket
    ticket.comments.push(newComment._id);

    await ticket.save();

    return res.status(200).json({
      ok: true,
      comments: _comment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return sendError(res);
  }
};

const pickedByMe = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      pickedBy: req.user._id,
      "movements.status": { $ne: "escalated" },
    }).populate("comments");
    return res.status(200).json({ ok: true, tickets });
  } catch (error) {
    console.error("Error adding comment:", error);
    return sendError(res);
  }
};

const markTicketAsResolvedByAgent = async (req, res) => {
  try {
    const { ticketId } = req.body;

    // Validate inputs
    if (!ticketId) {
      return res.status(400).json({ message: "Both ticketId is required" });
    }

    // Find the ticket by its ID
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if ((ticket.status = "Resolved")) {
      return res.status(404).json({ message: "Ticket is already resolved" });
    }
    // Additional checks can be done here, for example, to verify that the user
    // resolving the ticket has the necessary permissions or that the ticket status
    // is in a state that allows it to be resolved.

    // Update the ticket status and resolvedAt fields
    ticket.status = "Resolved";
    ticket.resolvedAt = new Date();

    // Save the changes
    await ticket.save();

    return res
      .status(200)
      .json({ message: "Ticket marked as resolved", ticket });
  } catch (error) {
    console.log("Error in markTicketAsResolved:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while resolving the ticket" });
  }
};

const escalateTicketByAgent = async (req, res) => {
  try {
    const { ticketId, why, escalatedTo } = req.body;

    // Validate inputs
    if (!ticketId || !why || !escalatedTo) {
      return res
        .status(400)
        .json({ message: "All fields are required for escalation" });
    }

    // Find the ticket by its ID
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if the user escalating the ticket is an agent and has the authority to do so
    const agent = await User.findById(req.user._id);
    if (!agent || agent.role !== "agent") {
      return res
        .status(403)
        .json({ message: "Only agents can escalate tickets" });
    }

    // Additional checks can be done here, for example, to verify the status of the ticket

    // Check if escalatedTo user exists and is of the appropriate role (likely a manager or admin)
    const escalateToUser = await User.findById(escalatedTo);
    if (
      !escalateToUser ||
      !["manager", "admin"].includes(escalateToUser.role)
    ) {
      return res.status(400).json({ message: "Invalid user to escalate to" });
    }

    // Update the escalated field in the ticket
    ticket.escalated.push({
      yes: true,
      why,
      escalatedTo,
      escalatedAt: new Date(),
    });

    // Save the changes
    await ticket.save();

    return res
      .status(200)
      .json({ message: "Ticket escalated successfully", ticket });
  } catch (error) {
    console.log("Error in escalateTicket:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while escalating the ticket" });
  }
};

const escalateTicketByManager = async (req, res) => {
  try {
    const { ticketId, why, escalatedTo } = req.body;

    // Validate inputs
    if (!ticketId || !why || !escalatedTo) {
      return res
        .status(400)
        .json({ message: "All fields are required for escalation" });
    }

    // Find the ticket by its ID
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if the user escalating the ticket is a manager
    const manager = await User.findById(req.user._id);
    if (!manager || manager.role !== "manager") {
      return res
        .status(403)
        .json({ message: "Only managers can escalate tickets" });
    }

    // Additional checks can be done here, for example, to verify the status of the ticket

    // Check if escalatedTo user exists and is of the appropriate role (likely an admin)
    const escalateToUser = await User.findById(escalatedTo);
    if (!escalateToUser || !["admin"].includes(escalateToUser.role)) {
      return res.status(400).json({ message: "Invalid user to escalate to" });
    }

    // Update the escalated field in the ticket
    ticket.escalated.push({
      yes: true,
      why,
      escalatedTo,
      escalatedAt: new Date(),
    });

    // Save the changes
    await ticket.save();

    return res
      .status(200)
      .json({ message: "Ticket escalated successfully by manager", ticket });
  } catch (error) {
    console.log("Error in escalateTicketByManager:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while escalating the ticket" });
  }
};

// getting all tickets by client
const gettingAllTickets = async (req, res) => {
  const { status } = req.body;

  try {
    // if (!status) return sendError(res, "Please select the ticket status", 400);
    const tickets = await Ticket.find({
      createdBy: req.user._id,
      status: "Open",
    }).populate("category");
    return res.json({ tickets, ok: true });
  } catch (error) {
    console.log(error);
    sendError(res);
  }
};

const gettingTicketsByCategory = async (req, res) => {
  try {
    const agent = await User.findById(req.user._id);
    const tickets = await Ticket.find({
      category: agent.category,
      status: "Open",
    }).populate("category");

    res.json({ ok: true, tickets });
  } catch (error) {
    console.log(error);
    sendError(res);
  }
};

const ticketById = async (req, res) => {
  const { _id } = req.params;

  try {
    const singleTicket = await Ticket.findById({ _id })
      .populate("createdBy")
      .populate("category")
      .populate("comments");

    res.json(singleTicket);
  } catch (error) {
    console.log(error);
    sendError(res);
  }
};

const deleteComment = async (req, res) => {
  try {
    const _comment = await comment_Schema.findById({ _id: req.params._id });
    // console.log(_comment.createdBy.subString(), req.user._id, "here is");
    if (_comment.createdBy.equals(req.user._id)) {
      await _comment.deleteOne();
      return res.json({ ok: true });
    } else {
      return res.json({ error: "You are not allowed to delete this comment" });
    }
  } catch (error) {
    console.log(error);
    sendError(res);
  }
};

const addReply = async (req, res) => {
  try {
    const { content, commentId } = req.body;

    // Validate inputs
    if (!content || !commentId) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    // Create a new reply
    const newReply = new reply_schema({
      content,
      createdBy: req.user._id,
      commentId,
    });

    const _reply = await newReply.save();

    // Add the reply to the comment's replies list
    await Comment.findByIdAndUpdate(commentId, {
      $push: { replies: newReply._id },
    });

    res.status(201).json({ ok: true, _reply });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const removeReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    // Remove the reply from the comment's replies list
    await Comment.updateOne(
      { replies: replyId },
      { $pull: { replies: replyId } }
    );

    // Delete the reply
    await reply_schema.findByIdAndDelete(replyId);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Remove the reply from the comment's replies list
    const _replies = await reply_schema.find({ commentId });

    res.status(200).json({ ok: true, _replies });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const escalateTicket = async (req, res) => {
  const { ticketId, reason } = req.body;

  try {
    // Fetch the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // You might want to check if the ticket can be escalated based on its current status
    // For example:
    if (ticket.status !== "In Progress") {
      return res
        .status(400)
        .json({ error: "Ticket cannot be escalated at this stage" });
    }

    // Add to the movements field
    ticket.movements.push({
      yes: true,
      status: "escalated",
      why: reason,
      movedTo: null, // The user escalating the ticket
      escalatedAt: new Date(),
    });

    // You might want to change the ticket status or any other fields as necessary
    ticket.status = "In Progress"; // Or whatever status you deem appropriate for an escalated ticket

    // we can downgrad the priority here;

    await ticket.save();

    res
      .status(200)
      .json({ message: "Ticket successfully escalated", ok: true });
  } catch (error) {
    console.error("Error escalating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const gettingAllEscalatingTickets = async (req, res) => {
  try {
    // Fetch all tickets that have been escalated
    const escalatedTickets = await Ticket.find({
      "movements.status": "escalated",
    })
      .populate("pickedBy", "name email")
      .populate("createdBy", "name email");

    return res.status(200).json({ ok: true, tickets: escalatedTickets });
  } catch (error) {
    console.error("Error fetching escalated tickets:", error);
    return sendError(res); // Assuming sendError is a function you've defined elsewhere to handle sending error responses
  }
};

module.exports = {
  createTicketByClient,
  pickTicket,
  addCommentToTicket,
  markTicketAsResolvedByAgent,
  escalateTicketByAgent,
  escalateTicketByManager,
  gettingAllTickets,
  gettingTicketsByCategory,
  pickedByMe,
  ticketById,
  deleteComment,
  addReply,
  removeReply,
  getReplies,
  escalateTicket,
  gettingAllEscalatingTickets
};
