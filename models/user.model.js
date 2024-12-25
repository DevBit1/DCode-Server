const { model, Schema, models } = require('mongoose')
const { hash, compare } = require('bcrypt')
const { customError } = require('../middlewares/errorMiddleware')
const { transporter } = require('../config/mailConfig')
const mailTemplate = require('../Mail templates/userCreated')

const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['creator', 'solver'],
        default: "solver"
    },
    isFirstLogin: {
        type: Boolean,
        // default: true
    }
},
    {
        timestamps: true
    })


schema.pre('save', async function (next) {
    if (!this.isModified("password"))
        return next()

    this.password = await hash(this.password, 10)
})



schema.methods = {
    comparePassword: async function (password) {
        // console.log("comparing",password, this.password)
        const isMatch = await compare(password, this.password)

        return isMatch
    },
    sendMail: async function (email, name, password) {
        try {
            await transporter().sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                text: "New user",
                html: mailTemplate(email, name, password)
            })
        } catch (error) {
            console.error("Error while sending mail:  ", error)
            throw new Error(`Error while sending mail: ${error}`)
        }
    }
}



module.exports = models.User || model('User', schema)
