const { customError } = require("../../middlewares/errorMiddleware");
const Question = require("../../models/question.model");
const Tags = require("../../models/tags.model");
const tryCatch = require("../../utils/tryCatch");
const mongoose = require("mongoose")


exports.getAllQuestions = tryCatch(async (req, res, next) => {

    const { page = 1, limit = 10, search = "", tags = "", difficulty = "" } = req.query
    const userId = new mongoose.Types.ObjectId(req.user.userId)

    let tagsArray

    // This next part allows us to filter question search based on "tags" name instead of giving "_ids" in the query parameter
    if (tags) {
        tagsArray = tags.split(",")

        tagsArray = await Promise.all(tagsArray.map((ele) => Tags.findOne({ name: { $regex: ele, $options: "i" } }, { _id: 1 })))

        // we have to filter here bcs if there is a tag name that doesn't exist or there is an invalid name
        tagsArray = tagsArray.filter((ele) => ele)

        console.log(tagsArray)

        if (tagsArray.length > 0) {
            // console.log(tagsArray)
            tagsArray = tagsArray.map((ele) => ele._id)
        }
    }

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
        {
            $facet: {
                data: [
                    {
                        $lookup: {
                            from: "tags",
                            localField: "tags",
                            foreignField: "_id",
                            pipeline: [
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
                        $lookup: {
                            from: "solutions",
                            // We can't access the fields of the main documents directly in the pipeline , we can do for the foreign document though using normal variable expression "$<field>" , to access the fields from the main document we will have to declare them in the "let" and access them as "$$<field>"
                            let: { questionId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                // {questionId : "$questionId"} Can't do this normal query inside "$expr"
                                                { $eq: ["$questionId", "$$questionId"] },
                                                { $eq: ["$userId", userId] }
                                                // { userId: userId }
                                            ]
                                        }

                                    }
                                }
                            ],
                            as: "solution"
                        }
                    },
                    {
                        $addFields: {
                            status: {
                                $switch: {
                                    branches: [
                                        {
                                            case: { $eq: [{ $size: "$solution" }, 0] },
                                            then: "Not Attempted"
                                        },
                                        {
                                            case: { $eq: [{ $arrayElemAt: ["$solution.isSolved", 0] }, true] },
                                            then: "Completed"
                                        },
                                        {
                                            case: { $eq: [{ $arrayElemAt: ["$solution.isSolved", 0] }, false] },
                                            then: "Attempted"
                                        }
                                    ],
                                    default: "Some issue"
                                }
                            },
                            submissions: {
                                // We have to conditionally give value here bcs when there is no Solution for a question "$arrayElemAt" will throw error we give a non-existent data
                                $cond: {
                                    if: {
                                        $and: [
                                            { $isArray: "$solution" },
                                            { $gte: [{ $size: "$solution" }, 1] }
                                        ]
                                    },
                                    then: {
                                        $size: {
                                            $arrayElemAt: ["$solution.solutions", 0]
                                        }
                                    },
                                    else: 0
                                }
                            }
                        }
                    },
                    {
                        $skip: ((page - 1) * limit)
                    },
                    {
                        $limit: Number(limit)
                    },
                    {
                        $project: {
                            solution: 0
                        }
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
                totalQuestions: { $arrayElemAt: ["$totalQuestions.count", 0] }
            }
        }
    ])


    const totalPages = Math.ceil(result[0].totalQuestions / limit)

    res.status(200).json({
        success: true,
        result: result[0].data,
        totalPages
    })
})

exports.getQuestionDetails = tryCatch(async (req, res, next) => {
    const { questionId } = req.params
    const { userId } = req.user

    // console.log(userId, questionId)

    const question = await Question.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(questionId)
            }
        },
        {
            $lookup: {
                from: "tests",
                foreignField: "_id",
                localField: "testCases",
                as: "testCases"
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
            $lookup: {
                from: "solutions",
                let: { questionId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$questionId", "$$questionId"] // equal check like this bcs we can't convert "$$questionId" to ObjectId if it was normal like below, here "$expr" allows us to use the value of "$$questionId" without converting it into string
                            },
                            userId: new mongoose.Types.ObjectId(userId)
                        }
                    },
                    {
                        $lookup: {
                            from: "attempts",
                            foreignField: "_id",
                            localField: "solutions",
                            as: "solutions"
                        }
                    },
                    {
                        $project: {
                            solutions: 1
                        }
                    },
                    // Creates a "Solution" document for every "attempt" object
                    {
                        $unwind: "$solutions"
                    },
                    {
                        $replaceWith: "$solutions"
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },
                    {
                        $addFields: {
                            createdAt: {
                                $dateToString: {
                                    date:"$createdAt",
                                    timezone:"Asia/Kolkata"
                                }
                            }
                        }
                    }
                ],
                as: "submissions"
            }
        }
    ])



    res.json({
        success: true,
        question: question[0]
    })
})