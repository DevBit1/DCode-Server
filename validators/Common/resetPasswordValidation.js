const { checkSchema } = require("express-validator");


exports.resetPasswordValidation = checkSchema({
    oldPassword: {
        in: ['body'],
        exists: {
            errorMessage: "Old Password is required!"
        },
        notEmpty: {
            errorMessage: "Old password can't be empty"
        },
        trim: true
    },
    newPassword: {
        in: ['body'],
        exists: {
            errorMessage: "New Password is required!"
        },
        notEmpty: {
            errorMessage: "New password can't be empty"
        },
        trim: true
    }
})