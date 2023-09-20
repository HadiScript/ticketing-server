const jwt = require("jsonwebtoken");
const User = require("../models/user_schema");

const loginReq = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.secrets_cy_of_tc);
      console.log(decoded, "from decode.");
      req.user = await User.findById({ _id: decoded._id }).select("-password");
      next();
    } catch (error) {
      console.error(error);
      res.status(401).send("Not authorized, token failed");
    }
  } else {
    res.status(401).send("Not authorized, token failed");
  }
};

const isAdmin = async (req, res, cb) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== "admin") {
      return res.status(400).send("Unathorized");
    } else {
      cb();
    }
  } catch (err) {
    console.log(err);
  }
};

const AdminAndManager = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    switch (user.role) {
      case "admin":
        next();
        break;
      case "manager":
        next();
        break;
      default:
        return res.status(403).send("Unauhorized");
    }
  } catch (err) {
    console.log(err);
  }
};

const isAgent = async (req, res, cb) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== "agent") {
      return res.status(400).send("Unathorized");
    } else {
      cb();
    }
  } catch (err) {
    console.log(err);
  }
};

const isManager = async (req, res, cb) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== "manager") {
      return res.status(400).send("Unathorized");
    } else {
      cb();
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  loginReq,
  isAdmin,
  AdminAndManager,
  isAgent,
  isManager,
};
