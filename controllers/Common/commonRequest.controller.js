const { mongoose } = require("mongoose")
const Request = require("../../models/request.model")
const tryCatch = require("../../utils/tryCatch")
const { sendRequests } = require("../../Event Emitters/requestNotify")


exports.getAllRequests = tryCatch(async (req, res, next) => {
    const { userId } = req.user
    const temp = new mongoose.Types.ObjectId(userId)

    const allRequests = await Request.find({ receiver: temp })


    res.json({
        success: true,
        allRequests
    })
})

// Returns all the "users" that have got the request, we are returning "users" here bcs in F.E "disabledUsers" is an array of users
exports.getRoomRequests = tryCatch(async (req, res, next) => {
    const { userId } = req.user
    const { room } = req.params
    const temp = new mongoose.Types.ObjectId(userId)

    const requests = await Request.aggregate([
        {
            $match: {
                sender: temp,
                room: { $regex: room, $options: "i" }
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "receiver",
                as: "receiver"
            }
        },
        {
            $unwind: "$receiver"
        },
        {
            $replaceWith: "$receiver"
        }
    ])

    res.json({
        success: true,
        message: "Here are the users",
        requests
    })

})




exports.sendRequest = tryCatch(async (req, res, next) => {
    const { userId } = req.user
    // Allows to send requests to multiple users
    // "receiver" here is the "_id"s 
    const { receiver = [], room } = req.body

    const allRequests = await Promise.all(receiver.map(ele => Request.create({
        room,
        sender: userId,
        receiver: ele
    })))

    // sendRequests(receiver, allRequests)


    res.json({
        success: true,
        message: "Requests sent successfully",
    })
})

// Add the necessary validation usin express-validator
exports.acceptRequest = tryCatch(async (req, res, next) => {
    const { requestId } = req.params
    const { userId } = req.body

    const updatedRequest = await Request.findByIdAndUpdate(requestId, { status: "accepted" }, { new: true })

    res.json({
        success: true,
        message: "Joined room successfully"
    })
})

// exports.leaveRoom = tryCatch(async (req, res, next) => {

// })