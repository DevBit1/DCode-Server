const { model, Schema, models } = require("mongoose")

const schema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
},
    {
        timestamps: true
    })

module.exports = models.Tag || model("Tag", schema)