const { model, Schema, models } = require('mongoose')



const schema = new Schema({
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    solutions: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Attempt'
        }
    ],
    isSolved: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    })


module.exports = models.Solution || model('Solution', schema)