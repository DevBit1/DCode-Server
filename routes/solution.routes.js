const { submitAttempt } = require('../controllers/solution.controller')
const { textUpload } = require('../config/multer')
const { Authenticated } = require('../middlewares/auth')
const { questionIDValidation } = require('../validators/Question.validation')
const { validatorHandler } = require('../validators/validatorHandler')
const { solutionValidation } = require('../validators/solutionValidation')

const router = require('express').Router()

router.post('/submit/:questionId',
    questionIDValidation,
    solutionValidation,
    validatorHandler,
    textUpload,
    Authenticated,
    submitAttempt
)

module.exports = router