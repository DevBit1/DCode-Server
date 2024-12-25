const { checkSchema } = require("express-validator");
const User = require("../models/user.model");


exports.createUserValidation = checkSchema({
    name: {
        in: ["body"],
        exists: {
            errorMessage: "Name of the user is required"
        },
        notEmpty: {
            errorMessage: "Name can't be empty"
        },
        trim: true
    },
    email: {
        in: ["body"],
        exists: {
            errorMessage: "Email for the user is required"
        },
        notEmpty: {
            errorMessage: "Email can't be empty"
        },
        custom: {
            options: async (value) => {
                const user = await User.findOne({ email: value })

                if (user) {
                    throw new Error("User email is already taken!!")
                }

                return true
            }
        },
        trim: true
    }
})