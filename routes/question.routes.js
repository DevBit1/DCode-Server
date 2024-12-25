const { getAllQuestions, getQuestionDetails } = require('../controllers/Common/commonQuestion.controller')
const { getAllTags } = require('../controllers/Common/commonTag.controller')
const { Authenticated } = require('../middlewares/auth')
const { questionIDValidation } = require('../validators/Question.validation')
const { paginationValidation } = require('../validators/Common/paginationValidation')
const { validatorHandler } = require('../validators/validatorHandler')


const router = require('express').Router()

router.use(Authenticated)

router.get('/tags', getAllTags)
router.get('/questions',
    paginationValidation,
    validatorHandler,
    getAllQuestions
)
router.get('/question/:questionId',
    questionIDValidation,
    validatorHandler,
    getQuestionDetails
)



module.exports = router