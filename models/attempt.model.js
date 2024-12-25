const { model, Schema, models } = require('mongoose')



const schema = new Schema({
    solutionId: {
        type: Schema.Types.ObjectId,
        ref: "Solution",
        required: true
    },
    code: {
        type: String,
        required: true
    },
    success: {
        type: Boolean,
        required: true
    },
    passedTests: [
        {
            name: {
                type: String,
                required: true
            },
            actual: {
                type: Schema.Types.Mixed,
                required: true
            },
            expected: {
                type: Schema.Types.Mixed,
                required: true
            },
            input: {
                type: Schema.Types.Mixed,
                required: true
            }
        }
    ],
    failedTests: [
        {
            name: {
                type: String,
                required: true
            },
            actual: {
                type: Schema.Types.Mixed,
                required: true
            },
            expected: {
                type: Schema.Types.Mixed,
                required: true
            },
            input: {
                type: Schema.Types.Mixed,
                required: true
            }
        }
    ]

},
    {
        timestamps: true
    })


module.exports = models.Attempt || model('Attempt', schema)