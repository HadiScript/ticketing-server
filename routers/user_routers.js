const express = require("express");
const {
  RegisterAnyone,
  RegisterForClient,
  Login,
  currentUser,
  UpdateUserByAdmin,
  updateUserByUser,
  GetAllUsers,
  DeleteUser,
  getAgentsByMostTicketsSolved,
  getUsersWhoBreachedSecondSLA,
  AllClient,
  AllAgent,
  AllAdmin,
  AllManager,
} = require("../controllers/user_cntrl");
const {
  loginReq,
  isAdmin,
  AdminAndManager,
  isAgent,
  isManager,
} = require("../middlewares/auths");
const User = require("../models/user_schema");

const router = express.Router();

router.post("/register/a/user", RegisterAnyone);
router.post("/register", RegisterForClient);
router.post("/login", Login);
router.get("/current-user", loginReq, currentUser);

//localhost:9000/api/all-client
router.get("/all-client", loginReq, AdminAndManager, AllClient);
router.get("/all-agent", loginReq, AdminAndManager, AllAgent);
router.get("/all-manager", loginReq, isAdmin, AllManager);
router.get("/all-admin", loginReq, isAdmin, AllAdmin);

// for login users
router.put("/update-user", loginReq, updateUserByUser);

router.get("/current-client", loginReq, currentUser);
router.get("/current-agent", loginReq, isAgent, currentUser);
router.get("/current-manager", loginReq, isManager, currentUser);
router.get("/current-admin", loginReq, isAdmin, currentUser);
// Use adminRoutes for all routes prefixed with '/by/auth'

const adminRoutes = express.Router();

adminRoutes.get("/get-users", GetAllUsers);
adminRoutes.get("/who/solved/most", getAgentsByMostTicketsSolved);
adminRoutes.get("/who/breached/2/sla", getUsersWhoBreachedSecondSLA);
adminRoutes.post("/update-user", UpdateUserByAdmin);
adminRoutes.delete("/delete-users/:_id", DeleteUser);

router.use("/by/auth", loginReq, AdminAndManager, adminRoutes);

// getAgentsByMostTicketsSolved
// getUsersWhoBreachedSecondSLA
module.exports = router;
