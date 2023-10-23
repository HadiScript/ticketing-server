const express = require("express");

const { isAgent, loginReq } = require("../middlewares/auths");
const { getAgentDashboardData, getAgentTicketHistory, getTicketByCatgories, getSecondSlaBreachedTickets } = require("../controllers/UserDashboard_cntrl");

const router = express.Router();

router.get("/agent-numbers", loginReq, isAgent, getAgentDashboardData);
router.get("/ticket-logs", loginReq, isAgent, getAgentTicketHistory);
router.get("/ticket-category", loginReq, isAgent, getTicketByCatgories);
router.get("/second-sla-breached", loginReq, isAgent, getSecondSlaBreachedTickets);

module.exports = router;
