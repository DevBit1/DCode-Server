const tryCatch = require("../utils/tryCatch");
const Solution = require("../models/solution.model");
const Attempt = require("../models/attempt.model")
const Question = require("../models/question.model")

const submitAttempt = tryCatch(async (req, res, next) => {
    const { questionId } = req.params
    const { code, testResults } = req.body
    const { userId } = req.user

    // console.log(questionId)

    let solution = await Solution.findOne({ questionId: questionId, userId: userId })


    // Only needed in case of "FormData"
    // let testResults = JSON.parse(testResults)
    // console.log("This is done")

    if (!solution) {
        solution = await Solution.create({
            questionId: questionId,
            solutions: [],
            userId
        })

    }


    let attempt = new Attempt({
        code,
        success: testResults.success,
        solutionId: solution._id,
        passedTests: [...testResults.passedTests],
        failedTests: [...testResults.failedTests]
    })

    await attempt.save()

    // console.log(attempt)

    solution.solutions.push(attempt._id)

    if (testResults.success) {
        solution.isSolved = true
    }

    await solution.save()

    res.status(201).json({
        success: true,
        message: "Submitted successfully",
        attempt
    })

})

module.exports = {
    submitAttempt
}


