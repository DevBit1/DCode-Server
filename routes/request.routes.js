const { sendRequest, acceptRequest, getAllRequests, getRoomRequests } = require("../controllers/Common/commonRequest.controller")
const { getMyRooms } = require("../controllers/Common/commonRoom.controller")
const { Authenticated } = require("../middlewares/auth")

const router = require("express").Router()


router.use(Authenticated)

// Rooms
router.get("/getRooms", getMyRooms)

// Requests
router.post("/send-request", sendRequest)
router.post("/accept-request/:requestId", acceptRequest)
router.get("/getAllRequests", getAllRequests)
router.get("/getRoomRequests/:room", getRoomRequests)


module.exports = router 