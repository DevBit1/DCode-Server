const { resetPassword } = require('../../controllers/Common/commonAuth.controller')
const { getBasicStats, getStatsByTime, lastSubmissions } = require('../../controllers/User/user.controller')
const { login } = require('../../controllers/User/userAuth.controller')
const { Authenticated } = require('../../middlewares/auth')
const { loginValidation } = require('../../validators/Auth.validation')
const { paginationValidation } = require('../../validators/Common/paginationValidation')
const { resetPasswordValidation } = require('../../validators/Common/resetPasswordValidation')
const { statsByTimeValidation } = require('../../validators/Common/statsByTimeValidation')
const { validatorHandler } = require('../../validators/validatorHandler')


const router = require('express').Router()

router.post('/login', loginValidation, validatorHandler, login)


// router.get('/users', getAllUsers)

// Needs authorization

router.use(Authenticated)

router.post('/reset-password',
    resetPasswordValidation,
    validatorHandler,
    resetPassword
)

// Dashboard
router.get("/dashboard/basic", getBasicStats)
router.get("/dashboard/byTime",
    statsByTimeValidation,
    validatorHandler,
    getStatsByTime
)
router.get("/dashboard/previousRecords",
    paginationValidation,
    validatorHandler,
    lastSubmissions
)




module.exports = router

