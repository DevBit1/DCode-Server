const { verify } = require("jsonwebtoken")
const { JSONCookies } = require("cookie-parser")

const authHandler = (socket, next) => {

    // The headers work similarly to http headers, where the cookie is sent by default by the client if withCredentials :true
    const authCookie = socket.handshake.headers.cookie ? JSONCookies(socket.handshake.headers.cookie) : null
    const authHeader = socket.handshake.auth.token

    const token = authCookie.authToken || authHeader

    try {
        if (!token) {
            return next(new Error("Unauthorized access"))
        }

        const decoded = verify(token, process.env.JWT_SECRET)

        socket.data.user = decoded

        return next()

    } catch (error) {
        return next(error)
    }

}

module.exports = authHandler