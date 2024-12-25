const { customError } = require("../../middlewares/errorMiddleware")
const User = require("../../models/user.model")
const tryCatch = require("../../utils/tryCatch")



exports.logout = tryCatch(async (req, res, next) => {
    res.status(200).cookie("authToken", "", {
        expires: new Date(Date.now() + (15 * 1000))
    }).json({
        message: "Logged Out successfully"
    })
})

exports.resetPassword = tryCatch(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const { userId } = req.user

    const user = await User.findById(userId).select("+password")

    if(!user){
        return next(new customError("User not found", 404))
    }

    // console.log(oldPassword, newPassword, user)
    // console.log(user)
    // console.log(oldPassword, newPassword)
    const isOldPasswordMatch = await user.comparePassword(oldPassword)

    if(!isOldPasswordMatch){
        return next(new customError("Please provide the right old password", 403))
    }

    user.password = newPassword
    
    // If its a first login, because i intend to use this controller for other password resets as well
    if(user.isFirstLogin){
        user.isFirstLogin = false
    }

    await user.save()

    res.status(200).json({ message: "Password reset successfully." });
})