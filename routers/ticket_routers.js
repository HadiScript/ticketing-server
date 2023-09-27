const express = require("express");

const { loginReq,  isAgent, AdminAndManager } = require("../middlewares/auths");
const { createTicketByClient, pickTicket, addCommentToTicket, escalateTicketByAgent, escalateTicketByManager, markTicketAsResolvedByAgent, gettingAllTickets, gettingTicketsByCategory, pickedByMe } = require("../controllers/tickets_cntrl");

const router = express.Router();


router.post('/add/ticket', loginReq,createTicketByClient);
router.get('/my/tickets', loginReq, gettingAllTickets)

router.put('/by/agent/pick', loginReq, isAgent, pickTicket);
router.get('/by/agent/category/list', loginReq, isAgent, gettingTicketsByCategory)
router.put('/by/agent/add/comment', loginReq, isAgent, addCommentToTicket)
router.get('/by/agent/picks', loginReq, isAgent, pickedByMe)

router.put('/by/agent/escalate', loginReq, isAgent, escalateTicketByAgent)
router.put('/by/agent/resolved', loginReq, isAgent, markTicketAsResolvedByAgent)
router.put('/by/auth/escalate', loginReq, AdminAndManager, escalateTicketByManager)




module.exports = router;
