const tryCatch = require("../../utils/tryCatch")
const { customError } = require("../../middlewares/errorMiddleware")
const User = require("../../models/user.model")
const { sendToken } = require("../../utils/sendToken")

exports.login = tryCatch(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new customError("Insufficient data for login", 400))
    }

    // We need the password here bcs in the model we have specified not to include 
    // Without the "+" in "select" if we write "password" it will return only "_id and password", but with "+" we get it along with the other properties
    const user = await User.findOne({ email }).select("+password")

    // console.log("Inside login: ", user)

    if (!user)
        return next(new customError("User not found", 404))

    const isMatch = await user.comparePassword(password)

    if (!isMatch)
        return next(new customError("Invalid credentials", 403))

    sendToken(res, user, "User logged in successfully!!", 200)
})

// exports.getAllUsers = tryCatch(async(req, res, next) => {
//     const users = await User.find().select("+password")

//     res.json({
//         users
//     })
// })

