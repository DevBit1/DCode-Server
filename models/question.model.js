const { model, Schema, models } = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    question: {
        type: String,
        required: true
    },
    serial: {
        type: Number,
        required: true
    },
    params: {
        type: Number,
        default: 1
    },
    testCases: {
        type: [
            {
                type: Schema.ObjectId,
                ref: 'Test'
            }
        ],
        required: true
    },
    codeStructure: {
        type: String,
        required: true
    },
    tags: {
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: "Tag"
            }
        ],
        required: true
    },
    difficulty: {
        type: String,
        enum: ["hard", "medium", "easy"]
    }
},
    {
        timestamps: true
    })


module.exports = models.Question || model('Question', schema)