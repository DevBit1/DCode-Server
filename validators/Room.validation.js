const { checkSchema } = require("express-validator")
const Room = require("../models/room.model")


exports.createRoomValidation = checkSchema({
    name: {
        in: ["body"],
        exists: {
            errorMessage: "Name for the room is required"
        },
        notEmpty: {
            errorMessage: "Name can't be empty"
        },
        custom: {
            options: async (value) => {
                try {
                    // "value" is not getting sanitized
                    const res = await Room.findOne({ name: { $regex: value.trim(), $options: "i" } })

                    if (res) {
                        throw new Error("Room name is already taken")
                    }

                    return true
                } catch (error) {
                    throw error
                }
            }
        },
        trim: true
    }
})

exports.deleteRoomValidation = checkSchema({
    name: {
        in: ["body"],
        exists: {
            errorMessage: "Name for the room is required"
        },
        notEmpty: {
            errorMessage: "Name can't be empty"
        },
        trim: true
    }
})