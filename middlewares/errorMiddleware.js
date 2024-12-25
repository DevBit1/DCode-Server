class customError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

const errorMw = (err, req, res, next) => {
    err.message ||= "Internal server error"
    err.statusCode ||= 500

    if (err.name === "CastError") {
        const message = `Resource not found. Invalid ${err.path}`,
            err = new customError(message, 400);
    }
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`,
            err = new customError(message, 400);
    }
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid, Try again!`;
        err = new customError(message, 400);
    }
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is expired, Try again!`;
        err = new customError(message, 400);
    }

    res.status(err.statusCode).json({
        message: err.message
    })
}

module.exports = { customError, errorMw }