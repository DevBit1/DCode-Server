const { Schema, model, models } = require('mongoose')

const schema = new Schema({
    description: {
        type: String,
        required: true
    },
    input: [
        {
            type: Schema.Types.Mixed,
            required: true
        }
    ],
    output: {
        type: Schema.Types.Mixed,
        required: true
    },
    matcher: {
        type: String,
        enum: ['toBe', 'toEqual', 'toBeNull', 'toBeTruthy', 'toBeFalsy'],
        default: "toBe"
    }
})

module.exports = models.Test || model('Test', schema)