const User = require("../models/user_schema");
const Ticket = require("../models/ticket_schema");
const { hashPassword, comparePassword } = require("../utils/Auth");
const jwt = require("jsonwebtoken");
const sendError = require("../utils/Error");
const mongoose = require("mongoose");

const RegisterAnyone = async (req, res) => {
  const { name, email, password, role, category } = req.body;

  // validation
  if (!name) {
    return res.json({ error: "Name is required" });
  } else if (!role) {
    return res.json({ error: "Role is required" });
  } else if (!category) {
    return res.json({ error: "category is required" });
  } else if (!password || password.length < 6) {
    return res.json({
      error: "Password is required and should be 6 charactor long",
    });
  }

  const exist = await User.findOne({ email });

  if (exist) {
    return res.json({ error: "Email is taken" });
  }

  // hashing the password
  const hashed = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashed,
    role,
    category,
  });

  try {
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.log("failed error", err);
    res.status(500).json({ error: "Error, Try again" });
  }
};

// not sending any data
const RegisterForClient = async (req, res) => {
  const { name, email, password } = req.body;

  // validation
  if (!name) {
    return res.json({ error: "Name is required" });
  } else if (!email) {
    return res.json({ error: "Email is required" });
  } else if (!password || password.length < 6) {
    return res.json({
      error: "Password is required and should be 6 charactor long",
    });
  }

  const exist = await User.findOne({ email });

  if (exist) {
    return res.json({ error: "Email is taken" });
  }

  // hashing the password
  const hashed = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashed,
    role: "client",
  });

  try {
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.log("failed error", err);
    res.status(500).json({ err: "Error, Try again" });
  }
};

// sending - data
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email }).populate(
      "image",
      "_id url public_id"
    );
    if (!user) return res.json({ error: "No user found" });
    if (!password) return res.json({ error: "Please enter your password" });

    // check password
    const match = await comparePassword(password, user.password);
    if (!match) return res.json({ error: "Credentials are not correct" });

    // create a signed token
    const token = jwt.sign({ _id: user._id }, process.env.secrets_cy_of_tc, {
      expiresIn: "4d",
    });

    user.password = undefined;
    user.passwordResetOTP = undefined;
    user.passwordResetExpiry = undefined;

    res.json({ user, token });
  } catch (error) {
    console.log("failed error", error);
    res.status(500).json({ error: "Error, Try again" });
  }
};

// not sending
const currentUser = async (req, res) => {
  try {
    // console.log("toucjed rom admin");
    const user = await User.findById(req.user._id).populate(
      "image",
      "url public_id"
    );

    res.json({ ok: true });
  } catch (error) {
    console.log("failed error", error);
    res.status(500).json({ error: "Error, Try again" });
  }
};

// sending
const UpdateUserByAdmin = async (req, res) => {
  try {
    const data = {};

    if (req.body.name) {
      data.name = req.body.name;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.json({
          error: "password required & should be minimum 6 chr long",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }

    if (req.body.role) {
      data.role = req.body.role;
    }

    if (req.body.category) {
      data.category = req.body.category;
    }

    let user = await User.findByIdAndUpdate(req.body.id, data, {
      new: true,
    });

    user.password = undefined;
    user.role = undefined;
    user.passwordResetOTP = undefined;
    user.passwordResetExpiry = undefined;

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ error: "Duplicate error" });
    }
    console.log("failed error", error);
  }
};

// get user by id
// sending
const GetUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id }).select(
      "-password -secret -passwordResetOTP -passwordResetExpiry "
    );
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

// sending
const GetAllUsers = async (req, res) => {
  //   console.log(req.body.blocked, "from getting all users");
  try {
    const users = await User.find().select(
      "-password -secret -passwordResetOTP -passwordResetExpiry"
    );
    res.json({ users });
  } catch (error) {
    console.log(error);
  }
};

const DeleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete({ _id: req.params._id });
    res.json({ ok: true });
  } catch (error) {
    console.log(error);
  }
};

// sending
const updateUserByUser = async (req, res) => {
  try {
    const { name, email, password, status, image } = req.body;

    const userFromDb = await User.findById(req.user._id);

    // // check if user is himself/herself
    // if (userFromDb._id.toString() !== req.user._id.toString()) {
    //   return res.status(403).send("You are not allowed to update this user");
    // }

    // check password length
    if (password && password.length < 6) {
      return res.json({
        error: "Password is required and should be 6 characters long",
      });
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || userFromDb.name,
        email: email || userFromDb.email,
        password: hashedPassword || userFromDb.password,

        // image: image || userFromDb.image,
        // exp: exp || userFromDb.exp,
      },
      { new: true }
    ).populate("image");

    res.json(updated);
  } catch (err) {
    console.log(err);
  }
};

// getting user who solved most of the tickets
const getAgentsByMostTicketsSolved = async (req, res) => {
  try {
    const aggregatedTickets = await Ticket.aggregate([
      { $match: { status: "Resolved" } },
      {
        $group: {
          _id: "$assignedTo",
          solvedCount: { $sum: 1 },
        },
      },
      {
        $sort: { solvedCount: -1 },
      },
    ]);

    // Fetch the actual user details
    const userIds = aggregatedTickets.map((a) => a._id);
    const users = await User.find({ _id: { $in: userIds }, role: "agent" });

    // Return the users sorted by most tickets solved
    let resUsers = users.sort((a, b) => {
      const countA = aggregatedTickets.find(
        (ticket) => String(ticket._id) === String(a._id)
      ).solvedCount;
      const countB = aggregatedTickets.find(
        (ticket) => String(ticket._id) === String(b._id)
      ).solvedCount;
      return countB - countA;
    });

    res.json(resUsers);
  } catch (error) {
    console.log(err);
  }
};

// users who breach second SLA
const getUsersWhoBreachedSecondSLA = async (req, res) => {
  try {
    // Find all tickets where the second SLA has been breached
    const ticketsWithSLABreach = await Ticket.find({
      secondSLABreach: true,
    }).populate("createdBy");

    // Collect user IDs and their associated ticket IDs
    const userTicketsMap = new Map();
    for (const ticket of ticketsWithSLABreach) {
      if (ticket.createdBy && ticket.createdBy._id) {
        const userId = ticket.createdBy._id.toString();
        if (!userTicketsMap.has(userId)) {
          userTicketsMap.set(userId, []);
        }
        userTicketsMap.get(userId).push(ticket._id.toString());
      }
    }

    // Find users by their IDs and add their breached ticket IDs
    const userIds = Array.from(userTicketsMap.keys());
    const users = await User.find({ _id: { $in: userIds } });
    const usersWithTickets = users.map((user) => {
      const userObj = user.toObject();
      userObj.SecondSLABreachedTickets = userTicketsMap.get(
        user._id.toString()
      );
      delete userObj.password; // Remove the password from the output
      delete userObj.__v; // Remove the version key from the output
      return userObj;
    });

    return res.status(200).json({
      message: "Users who breached the second SLA",
      users: usersWithTickets,
    });
  } catch (error) {
    console.log("Error fetching users who breached the second SLA:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
};

// for manager and admin
const AllClient = async (req, res) => {
  try {
    const data = await User.find({ role: "client" }).select("-password");
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};
const AllManager = async (req, res) => {
  try {
    const data = await User.find({ role: "manager" }).select("-password");
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};
const AllAgent = async (req, res) => {
  try {
    const data = await User.find({ role: "agent" }).select("-password");
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};
const AllAdmin = async (req, res) => {
  try {
    const data = await User.find({ role: "admin" }).select("-password");
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const availableUsersForHandoverTickets = async (req, res) => {
  try {
    // 1. Get Current User and Category
    const currentUser = await User.findById(req.user._id);
    const userCategory = currentUser.category;

    // 2. Get All Agents in the Category
    const agentsInCategory = await User.find({
      role: "agent",
      category: userCategory,
    });

    const agentsWithFewPicks = [];

    // 3. Count Tickets per Agent and 4. Filter Agents
    for (let agent of agentsInCategory) {
      const ticketCount = await Ticket.countDocuments({
        pickedBy: agent._id,
        // add additional conditions if needed, e.g., only considering 'open' tickets etc.
      });

      if (ticketCount <= 5) {
        agent.password = undefined;
        agentsWithFewPicks.push(agent);
      }
    }

    // Respond with the filtered agents
    res.status(200).json({ ok: true, agents: agentsWithFewPicks });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
};

module.exports = {
  RegisterAnyone,
  RegisterForClient,
  Login,
  currentUser,

  updateUserByUser,
  UpdateUserByAdmin,
  DeleteUser,
  GetAllUsers,
  GetUser,

  getAgentsByMostTicketsSolved,
  getUsersWhoBreachedSecondSLA,
  AllClient,
  AllAgent,
  AllAdmin,
  AllManager,

  availableUsersForHandoverTickets,
};
