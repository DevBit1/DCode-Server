const { getOnlineUsers, getIO } = require("../Socket Handlers/onConnection")

exports.sendRequests = (receivers = [], requests = []) => {
    const onlineUsers = getOnlineUsers()
    const io = getIO()

    const allSocketIds = receivers.map((ele) => onlineUsers.get(ele))

    allSocketIds.forEach((ele, ind) => {
        io.to(ele).emit("requests")
    })



    // console.log(allSocketIds)
}