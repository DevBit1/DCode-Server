const { sign } = require('jsonwebtoken')
const { cookieOption } = require('../config/cookieOption')


exports.sendToken = (res, user, message, code) => {

    const payload = {
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name
    }

    // console.log(user)


    const token = sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY // 1 day
    })

    if (user.isFirstLogin) {
        // console.log("Inside sendToken : ",user)
        res.status(code).cookie('authToken', token, cookieOption).json({
            success: true,
            message,
            token,
            firstLogin: true
        })
    }
    else {
        res.status(code).cookie('authToken', token, cookieOption).json({
            success: true,
            message,
            token
        })
    }


}