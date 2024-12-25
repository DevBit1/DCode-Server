const { Schema, model } = require('mongoose')

const schema = new Schema({
    name: String,
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
},
    {
        timestamps: true
    }
)

module.exports = model("Room", schema)