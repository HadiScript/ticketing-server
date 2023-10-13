const express = require("express");

const { loginReq,  isAgent, AdminAndManager } = require("../middlewares/auths");
const { createTicketByClient, pickTicket, addCommentToTicket, escalateTicketByAgent, escalateTicketByManager, markTicketAsResolvedByAgent, gettingAllTickets, gettingTicketsByCategory, pickedByMe, ticketById, deleteComment, addReply, removeReply, getReplies, escalateTicket, gettingAllEscalatingTickets } = require("../controllers/tickets_cntrl");

const router = express.Router();


router.post('/add/ticket', loginReq,createTicketByClient);
router.get('/my/tickets', loginReq, gettingAllTickets)

router.put('/by/agent/pick', loginReq, isAgent, pickTicket);
router.get('/by/agent/category/list', loginReq, isAgent, gettingTicketsByCategory)
router.put('/by/agent/add/comment', loginReq, isAgent, addCommentToTicket)
router.get('/by/agent/picks', loginReq, isAgent, pickedByMe)
router.get('/by/agent/single/:_id', loginReq, isAgent, ticketById)

router.put('/by/agent/escalate', loginReq, isAgent, escalateTicketByAgent)
router.put('/by/agent/resolved', loginReq, isAgent, markTicketAsResolvedByAgent)
router.put('/by/auth/escalate', loginReq, AdminAndManager, escalateTicketByManager)

router.delete('/delete/comment/:_id', loginReq, deleteComment);
router.post('/add/reply', loginReq, addReply);
router.put('/remove/reply/:replyId', loginReq, removeReply)
router.get('/replies/:commentId', loginReq, getReplies)


router.put('/escalated-ticket', loginReq, isAgent, escalateTicket)
router.get('/all-escalated-tc', loginReq, AdminAndManager, gettingAllEscalatingTickets)





module.exports = router;
