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
} = require("../controllers/user_cntrl");
const { loginReq, isAdmin, AdminAndManager } = require("../middlewares/auths");

const router = express.Router();

router.post("/register/a/user", RegisterAnyone);
router.post("/register", RegisterForClient);
router.post("/login", Login);
router.get("/current-user", loginReq, currentUser);

// for login users
router.post("/update-user", loginReq, updateUserByUser);

// Use adminRoutes for all routes prefixed with '/by/auth'
const adminRoutes = express.Router();

adminRoutes.get("/current-admin", isAdmin, currentUser);
adminRoutes.get("/get-users", GetAllUsers);
adminRoutes.get("/who/solved/most", getAgentsByMostTicketsSolved);
adminRoutes.get("/who/breached/2/sla", getUsersWhoBreachedSecondSLA);
adminRoutes.post("/update-user", UpdateUserByAdmin);
adminRoutes.delete("/delete-users", DeleteUser);

router.use("/by/auth", loginReq, AdminAndManager, adminRoutes);

// getAgentsByMostTicketsSolved
// getUsersWhoBreachedSecondSLA
module.exports = router;
