const { validationResult } = require('express-validator')
const { customError } = require('../middlewares/errorMiddleware')


exports.validatorHandler = (req, res, next) => {
    let result = validationResult(req)

    if (!result.isEmpty()) {
        next(new customError(result.array()[0].msg, 400))
    }

    next()
}