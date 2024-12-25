const tryCatch = require("../utils/tryCatch")
const jwt = require("jsonwebtoken")
const { customError } = require("./errorMiddleware")


exports.Authenticated = tryCatch((req, res, next) => {

    // Extracting the token part
    const authHeader = req.headers['authorization'] && (
        req.headers['authorization'].startsWith('Bearer ') && (
            req.headers['authorization'].split(' ')[1]
        )
    )

    const { authToken } = req.cookies || authHeader || req.body

    // console.log(authToken)

    if (!authToken) {
        return next(new customError("You are not authorized", 403))
    }


    const decoded = jwt.verify(authToken, process.env.JWT_SECRET)

    req.user = Object.assign({}, decoded)

    next()
})


exports.authorize = (permittedRoled = ["creator"]) => {
    return (req, res, next) => {
        const { role } = req.user

        if(!permittedRoled.includes(role)){
            return next(new customError("You are not authorized", 403))
        }

        next()
    }
}

