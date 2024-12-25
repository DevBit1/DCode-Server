const tryCatch = require("../../utils/tryCatch")
const { customError } = require("../../middlewares/errorMiddleware")
const User = require("../../models/user.model")
const { sendToken } = require("../../utils/sendToken")
// const { setAdminLogin } = require("../../index")

let isAdminLoggedIn = false

const setAdminLogin = (val) => {
    isAdminLoggedIn = val
}
 
// "closures" in action 
exports.getAdminStatus = () => {
    return isAdminLoggedIn
}
 
exports.adminLogin = tryCatch(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new customError("Insufficient data for login", 400))
    }

    // We need the password here bcs in the model we have specified not to include 
    // Without the "+" in "select" if we write "password" it will return only "_id and password", but with "+" we get it along with the other properties
    const user = await User.findOne({ email }).select('+password')
    // console.log(user)

    if (!user)
        return next(new customError("User not found", 404))

    if (user.role != "creator")
        return next(new customError("Unauthorized access, You are not an admin", 403))

    const isMatch = await user.comparePassword(password)

    if (!isMatch)
        return next(new customError("Invalid credentials", 403))


    setAdminLogin(true)

    sendToken(res, user, "Admin logged in successfully!!", 200)
})


