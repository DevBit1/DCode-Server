const { Schema, model } = require('mongoose')

const schema = new Schema({
    room: String,
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ['accepted', "pending"],
        default : "pending"
    }
},
    {
        timestamps: true
    }
)

module.exports = model("Request", schema)