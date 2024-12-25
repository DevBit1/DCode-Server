const { checkSchema } = require("express-validator");


exports.loginValidation = checkSchema({
    email: {
        in: ["body"],
        exists: {
            errorMessage: "Email Field is missing"
        },
        notEmpty: {
            errorMessage: "Email can't be empty"
        },
        isEmail: {
            errorMessage: "Not a valid email format"
        },
        trim: true,
    },
    password: {
        in: ["body"],
        exists: {
            errorMessage: "Password is missing"
        },
        notEmpty: {
            errorMessage:"Password can't be empty"
        }
    }
})