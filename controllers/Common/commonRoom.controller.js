const { default: mongoose } = require("mongoose");
const Room = require("../../models/room.model");
const tryCatch = require("../../utils/tryCatch");


// Right now only for admin, has been kept in common folder bcs in future this api could be used for any user
exports.getMyRooms = tryCatch(async (req, res, next) => {
    const { userId } = req.user

    const user = new mongoose.Types.ObjectId(userId)

    const rooms = await Room.find({
        creator: user
    })

    res.json({
        success: true,
        message: "Fetched your rooms",
        rooms
    })
})

exports.getRoomDetails = tryCatch(async (req, res, next) => {
    const { roomId } = req.params
    const temp = new mongoose.Types.ObjectId(roomId)

    const room = await Room.findOne({ _id: temp })

    res.json({
        success: true,
        message: "Fetched room Data",
        room
    })
})