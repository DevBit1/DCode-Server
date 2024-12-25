const { body, query } = require('express-validator')
const { textUpload } = require('../../config/multer')
const { createUser, getAllUsers, basicStats, statsByDate } = require('../../controllers/Admin/admin.controller')
const { adminLogin } = require('../../controllers/Admin/adminAuth.controller')
const { createQuestion, editQuestion, removeTestCase, addTestCase, getQuestionDetails, getQuestions } = require('../../controllers/Admin/adminQuestion.controller')
const { createTag } = require('../../controllers/Admin/adminTag.controller')
const { Authenticated, authorize } = require('../../middlewares/auth')
const { loginValidation } = require('../../validators/Auth.validation')
const { createQuestionValidation, questionIDValidation } = require('../../validators/Question.validation')
const { createUserValidation } = require('../../validators/user.validation')
const { paginationValidation } = require('../../validators/Common/paginationValidation')
const { statsByTimeValidation } = require('../../validators/Common/statsByTimeValidation')
const { validatorHandler } = require('../../validators/validatorHandler')
const { createRoom, deleteRoom, getUsersForRequest } = require('../../controllers/Admin/admin.room.controller')
const { createRoomValidation, deleteRoomValidation } = require('../../validators/Room.validation')


const router = require('express').Router()

router.post('/login', loginValidation, validatorHandler, adminLogin)

// Needs Authorization


router.use(Authenticated, authorize(["creator"]))

// Auth needed

// Users operations

router.post('/createUser',
    createUserValidation,
    validatorHandler,
    createUser,
)
router.get('/getAll',
    paginationValidation,
    query("order")
        .isIn(["asc", "desc"]).withMessage("Order must be one of 'asc' or 'desc'")
        .optional(),
    validatorHandler,
    getAllUsers
)
// router.post('/reset-password', Authenticated, resetPassword)


// Tags
router.post('/tags',
    body("name")
        .exists().withMessage("Name is required")
        .notEmpty().withMessage("Name can't be empty")
        .trim(),
    validatorHandler,
    createTag
)


//Question
router.get('/questions',
    paginationValidation,
    validatorHandler,
    getQuestions
)
router.get('/question/:questionId',
    questionIDValidation,
    paginationValidation,
    validatorHandler,
    getQuestionDetails
)
router.post('/question',
    createQuestionValidation,
    validatorHandler,
    textUpload,
    createQuestion
)
router.put('/question/:questionId',
    questionIDValidation,
    validatorHandler,
    editQuestion
)
router.put('/testcase/remove',
    questionIDValidation,
    validatorHandler,
    removeTestCase
)
router.put('/testcase/add/:questionId',
    questionIDValidation,
    validatorHandler,
    addTestCase
)


// Dashboard
router.get('/dashboard/basic', basicStats)
router.get('/dashboard/graph',
    statsByTimeValidation,
    validatorHandler,
    statsByDate
)


// Code Hub
router.post("/create-room", createRoomValidation, validatorHandler, createRoom)
router.post('/delete-room', deleteRoomValidation, validatorHandler, deleteRoom)
router.get('/getUsers', getUsersForRequest)


module.exports = router