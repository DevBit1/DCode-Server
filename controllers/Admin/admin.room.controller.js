const Room = require("../../models/room.model")
const Request = require("../../models/request.model")
const User = require("../../models/user.model")
const tryCatch = require("../../utils/tryCatch")
const { customError } = require("../../middlewares/errorMiddleware")


exports.createRoom = tryCatch(async (req, res, next) => {
    const { name } = req.body
    const { userId } = req.user

    const newRoom = new Room({ name, creator: userId })

    await newRoom.save()

    res.json({
        success: true,
        message: `Room ${name} created successfully`,
        newRoom
    })

})

exports.deleteRoom = tryCatch(async (req, res, next) => {
    const { name } = req.body // Need to delete a room based on "room name"
    const { userId } = req.user

    await Room.findOneAndDelete({ name: name })


    await Request.deleteMany({ room: { $regex: name, $options: "i" } })


    res.json({
        success: true,
        message: `Room deleted successfully`
    })

})

exports.getUsersForRequest = tryCatch(async (req, res, next) => {
    const { search = "" } = req.query

    const limit = 10

    const users = await User.aggregate([
        {
            $match: {
                $and: [
                    search ? { name: { $regex: search, $options: "i" } } : { _id: null },
                    { role: "solver" }
                ]
            }
        },
        {
            $project: {
                password: 0
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $limit: limit
        }
    ])

    res.json({
        success: true,
        message: "Fetched users for the operation",
        users
    })
})







