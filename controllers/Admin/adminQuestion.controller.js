const { customError } = require("../../middlewares/errorMiddleware")
const Question = require("../../models/question.model")
const Test = require("../../models/test.model")
const Solution = require("../../models/solution.model")
const User = require("../../models/user.model")
const tryCatch = require("../../utils/tryCatch")
const mongoose = require("mongoose")
const Tags = require("../../models/tags.model")






exports.createQuestion = tryCatch(async (req, res, next) => {
    const { title, question, testCases = [], params = 1, codeStructure, tags = [], difficulty = "easy" } = req.body


    const lastDoc = await Question.findOne().sort({ serial: -1 })

    let latestSerial = lastDoc ? lastDoc.serial + 1 : 1


    const allPromises = testCases.map((ele) => {
        return (
            Test.create({
                ...ele,
                input: [...ele.input]
            })
        )
    })

    const result = await Promise.all(allPromises)

    const testIDs = result.map(ele => ele._id)

    // Since from the frontend we get tag : {_id:"", name:""} from the autocomplete component
    const tagsArray = tags.length > 0 && tags.map((ele) => ele?._id || ele)


    const newQuestion = await Question.create({
        title,
        question,
        serial: latestSerial,
        testCases: testIDs,
        params,
        codeStructure,
        tags: tagsArray,
        difficulty
    })


    const populatedQuestion = { ...newQuestion._doc, testCases: [...result] }


    res.status(200).json({
        message: "Suucess",
        newQuestion: populatedQuestion
    })
})


exports.getQuestions = tryCatch(async (req, res, next) => {

    // Be sure to send tags in a comma separated string format which contains only names
    const { page = 1, limit = 10, search = "", tags = "", difficulty = "" } = req.query

    // console.log(tags)


    let tagsArray

    // This next part allows us to filter question search based on "tags" name instead of giving "_ids" in the query parameter
    if (tags) {
        tagsArray = tags.split(",")

        tagsArray = await Promise.all(tagsArray.map((ele) => Tags.findOne({ name: { $regex: ele, $options: "i" } }, { _id: 1 })))

        // we have to filter here bcs if there is a tag name that doesn't exist or there is an invalid name
        tagsArray = tagsArray.filter((ele) => ele)

        if (tagsArray.length > 0) {
            // console.log(tagsArray)
            tagsArray = tagsArray.map((ele) => ele._id)
        }
    }


    // aggregation by default returns an array, but with $facet it will now return an array but with one object inside with all the respective properties inside
    const result = await Question.aggregate([
        {
            $match: {
                $and: [
                    search ? { title: { $regex: search, $options: "i" } } : {},
                    tags ? { tags: { $in: tagsArray } } : {},
                    difficulty ? { difficulty } : {}
                ]
            }
        },
        // "$facet" allows us to parallely work on the same data set using multiple sub-pipelines
        // This will return an object with each pipeline returning its value into those specified keys
        {
            $facet: {
                data: [
                    {
                        // Populates "testCases" ==>> [testId, testId....] maps test Model
                        $lookup: {
                            from: "tests",
                            localField: "testCases",
                            foreignField: "_id",
                            as: "testCases"
                        }
                    },
                    {
                        // This will return an array containing all the solutions that match the _id
                        $lookup: {
                            from: "solutions",
                            localField: "_id",
                            foreignField: "questionId",
                            as: "attempts"
                        }
                    },
                    {
                        $lookup: {
                            from: "tags",
                            // We can't access the fields of the main documents directly in the pipeline , we can do for the foreign document through using normal variable expression "$<field>" , to access the fields from the main document we will have to declare them in the "let" and access them as "$$<field>"
                            let: { qTags: "$tags" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: ["$_id", "$$qTags"]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        name: 1,
                                    }
                                }
                            ],
                            as: "tags"
                        }
                    },
                    {
                        $addFields: {
                            totalTestCases: { $size: "$testCases" }, // Add field with count of array elements
                            // We need the number of actual attempts out of all the solutions
                            totalAttempts: {
                                $sum: {
                                    $map: {
                                        input: "$attempts",
                                        as: "attempt",
                                        in: { $size: "$$attempt.solutions" }
                                    }
                                }
                            },
                            successfullAttempts: {
                                $size: {
                                    $filter: {
                                        input: "$attempts",
                                        as: "item",
                                        cond: { $eq: ["$$item.isSolved", true] }
                                    }
                                }
                            }
                        }
                    },
                    {
                        // Needed to add this bcs $match stage is messing with the order when supplied a "search" query
                        $sort: {
                            createdAt: 1
                        }
                    },
                    {
                        $project: {
                            "attempts": 0
                        }
                    },
                    {
                        $skip: ((page - 1) * limit)
                    },
                    {
                        $limit: Number(limit)
                    }
                ],
                totalQuestions: [
                    {
                        $count: "count"
                    }
                ]
            }
        },
        {
            $project: {
                data: 1,
                // We access it as an array bcs "$facet" stage always returns data in an array format for each of its field
                // Here it first access the first element of "totalQuestions" then, we get the object whose value we access using "count"
                totalQuestions: { $arrayElemAt: ["$totalQuestions.count", 0] }
            }
        }
    ])


    const totalQuestions = result[0].totalQuestions || 0

    const totalPages = Math.ceil(totalQuestions / limit) || 1



    if (!result)
        return next(new customError("No questions have been added yet", 404))

    res.json({
        result: result[0].data,
        message: "Fetched everything",
        totalPages,
        totalQuestions
    })
})

// Getting question data
exports.getQuestionDetails = tryCatch(async (req, res, next) => {
    const { questionId } = req.params
    const { page = 1, search = "", limit = 10 } = req.query


    const question = await Question.findById(questionId)

    // console.log("Name", name)
    let user = null

    // Mind the role
    if (search.trim()) {
        // console.log(name)
        user = await User.find({ name: { $regex: search, $options: "i" }, role: "solver" }).select("_id")
        user = user.map((ele) => ele._id) // We only need the _id bcs in the aggregation we need to check from an array of _id and however we populate the stuff so no worries
    }



    const solutions = await Solution.aggregate([
        {
            $match: {
                $and: [
                    {
                        questionId: new mongoose.Types.ObjectId(questionId)
                    },
                    user ? { userId: { $in: user } } : {}
                ]
            }
        },
        {
            $facet: {
                data: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "userId",
                            as: "user"
                        }
                    },
                    {
                        $lookup: {
                            from: "attempts",
                            foreignField: "solutionId",
                            localField: "_id",
                            pipeline: [
                                {
                                    $sort: {
                                        createdAt: -1
                                    }
                                }
                            ],
                            as: "solutions"
                        }
                    },
                    {
                        $skip: ((page - 1) * limit)
                    },
                    {
                        $limit: Number(limit)
                    },
                    {
                        $addFields: {
                            user: { $arrayElemAt: ["$user", 0] }
                        }
                    },
                    {
                        $project: {
                            userId: 0,
                        }
                    }
                ],
                totalSolutions: [
                    {
                        $count: "count"
                    }
                ]
            }
        },
        {
            $project: {
                data: 1,
                totalSolutions: { $arrayElemAt: ["$totalSolutions.count", 0] } // "The "$totalSolutions.count" returns an array it is behaviour of "dot" notation in mongo when accessing the properties of nested object in an array field"
            }
        }

    ])

    const totalPages = Math.ceil(solutions[0].totalSolutions / limit)


    res.json({
        success: true,
        question,
        solutions: solutions[0].data,
        totalPages
    })
})


// Updating a Question
exports.editQuestion = tryCatch(async (req, res, next) => {
    const body = req.body
    const { questionId } = req.params

    // console.log(req.path, questionId)

    let testCaseUpdates

    if (body.testCases) {

        const allUpdates = body.testCases.map((ele) => (
            Test.findByIdAndUpdate(ele._id, { ...ele }, { new: true, runValidators: true })
        ))

        testCaseUpdates = await Promise.all(allUpdates)

        // This is a javascript level operation
        // We delete bcs in the next we intend to send the whole body to updating a Question but Testcase is different model
        delete body.testCases
    }


    let keys = Object.keys(body)

    if (keys.length > 0) {
        await Question.findByIdAndUpdate(questionId,
            {
                ...body
            },
            {
                new: true
            }
        )
    }

    // This is used to update the Question-list UI
    let newQuestion = await Question.findById(questionId).populate("testCases")


    return res.status(200).json({
        message: "Updated Successfully",
        testCaseUpdates,
        newQuestion
    })
})

exports.addTestCase = tryCatch(async (req, res, next) => {
    const body = req.body
    const { questionId } = req.params

    const newTest = await Test.create(body)

    await Question.findByIdAndUpdate(questionId, { $push: { testCases: newTest._id } })

    res.status(201).json({
        message: "Created a Test Case",
        newTest
    })
})

exports.removeTestCase = tryCatch(async (req, res, next) => {
    const { questionId, tId } = req.query

    const deletedTestCase = await Test.findById(tId)

    if (!deletedTestCase)
        return next(new customError("TestCase not found", 404))

    await Test.findByIdAndDelete(tId)


    const updatedQuestion = await Question.findByIdAndUpdate(questionId, { $pull: { testCases: tId } }, { new: true })

    res.json({
        message: "Deleted TestCase",
        deletedTestCase,
        updatedQuestion
    })
})

