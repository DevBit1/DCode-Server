const { default: mongoose } = require("mongoose")
const Attempt = require("../../models/attempt.model")
const Question = require("../../models/question.model")
const Solution = require("../../models/solution.model")
const User = require("../../models/user.model")
const tryCatch = require("../../utils/tryCatch")
const { getDay, getMonth, getDate } = require("date-fns")


const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]

const Months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec"
]

// Dashboard

exports.getBasicStats = tryCatch(async (req, res, next) => {
    const { userId } = req.user

    let subResult = [
        {
            label: "easy",
        },
        {
            label: "medium"
        },
        {
            label: "hard"
        }
    ]

    const subs = await Solution.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                isSolved: true
            }
        },
        {
            $lookup: {
                from: "questions",
                foreignField: "_id",
                localField: "questionId",
                as: "questionId"
            }
        },
        {
            $group: {
                _id: { $arrayElemAt: ["$questionId.difficulty", 0] },
                count: { $sum: 1 }
            }
        }
    ])


    subResult = await Promise.all(subResult.map(async (ele) => {
        ele.count = subs.find((item) => item._id == ele.label)?.count || 0
        ele.total = await Question.countDocuments({ difficulty: ele.label })
        return ele
    }))

    res.json({
        subResult,
    })
})

exports.getStatsByTime = tryCatch(async (req, res, next) => {
    const { order = "week", year = new Date().getFullYear().toString(), month = "" } = req.query


    // console.log("Reached")

    const { userId } = req.user 

    let to = new Date()
    let from = new Date(to)
    let result = []


    // This sets our "from" and "to" and also dummy data into our "result" array
    switch (order) {
        case "week": {
            // "-6" bcs we need records of the last 6 days , including whatever time has passed today, which makes it 7 days
            from.setDate(from.getDate() - 6)
            from.setHours(0, 0, 0, 0) // The beginning of this 7 day streak

            let temp = new Date(from)

            while (temp <= to) {
                result.push({
                    label: weekDays[getDay(temp)],
                    count: 0
                })
                temp.setDate(temp.getDate() + 1)
            }


            break;
        }
        case "year": {
            if (!month) {
                from = new Date(year, 0, 1, 0, 0, 0, 0) // Start of Jan 1
                to = new Date(year, 11, 31, 23, 59, 59, 999) // End of year last day of Dec
                // year -> 4-digit
                // month -> 0 based 
                // day -> starts from 1 to 31, "0" specifies the last day of the previous month

                for (let i = 0; i < 12; i++) {
                    result.push({
                        label: Months[i],
                        count: 0
                    })
                }
            }
            else {
                // Normally "months" are 0-based but here we get normal numbered months
                from = new Date(year, Number(month) - 1, 1, 0, 0, 0, 0) // specifies the first day of the month
                to = new Date(year, Number(month), 0, 23, 59, 59, 999) // Specifies the last day of the month
                // new Date(year, month, 0) specifying 0 returns the last day of the previous month, since "dates" are 1-31 based

                for (let i = 1; i <= to.getDate(); i++) {
                    result.push({
                        label: i,
                        count: 0
                    })
                }
            }
            break;
        }
        case "day": {
            from.setDate(from.getDate() - 1)
            let hours = to.getHours() + 1
            from.setHours(hours, 0, 0, 0)

            let temp = new Date(from)

            while (temp <= to) {
                result.push({
                    label: temp.getHours(),
                    count: 0
                })

                temp.setHours(temp.getHours() + 1)
            }

            break;
        }
        // This is for last 24 hours
        default: {
            from.setDate(from.getDate() - 1)
            let hours = to.getHours() + 1
            from.setHours(hours, 0, 0, 0)

            let temp = new Date(from)

            while (temp <= to) {
                result.push({
                    label: temp.getHours(),
                    count: 0
                })

                temp.setHours(temp.getHours() + 1)
            }
            break;
        }
    }

    const attempts = await Solution.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "attempts",
                foreignField: "_id",
                localField: "solutions",
                pipeline: [
                    {
                        $project: {
                            createdAt: 1
                        }
                    }
                ],
                as: "solutions"
            }
        },
        {
            $project: {
                solutions: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$solutions",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $gte: ["$$item.createdAt", from] },
                                        { $lte: ["$$item.createdAt", to] }
                                    ]
                                }
                            }
                        },
                        as: "ele",
                        in: {
                            createdAt: {
                                $dateToString: {
                                    date: "$$ele.createdAt",
                                    timezone: "Asia/Kolkata"
                                }
                            },
                            _id: "$$ele._id"
                        }
                    }
                }
            }
        },
        //Creates a individual document for each element in the specified array
        {
            $unwind: {
                path: "$solutions"
            }
        },
        { $replaceRoot: { newRoot: "$solutions" } }
    ])

    console.table([{ from: from.toLocaleString(), to: to.toLocaleString(), result: result.length, order }])


    switch (order) {
        case "week": {
            attempts.forEach((ele) => {
                const day = getDay(ele.createdAt)
                const temp = result.find((ele) => ele.label == weekDays[day])
                temp.count++
            })
            break;
        }
        case "year": {
            if (!month) {
                attempts.forEach((ele) => {
                    const month = getMonth(ele.createdAt)
                    const temp = result.find((ele) => ele.label == Months[month])
                    temp.count++
                })
            }
            else {
                attempts.forEach((ele) => {
                    let date = getDate(ele.createdAt)
                    const temp = result.find((ele) => ele.label == Number(date))
                    temp.count++
                })
            }
            break;
        }
        case "day": {
            attempts.forEach((ele) => {
                const hours = parseInt(ele.createdAt.split("T")[1].split(":")[0], 10) // can't use getHours() since it will try to set the time to local time zone adding extra hours but we don't need it since we are already doing it in the aggregation
                // console.log(ele.createdAt, hours)
                const temp = result.find((ele) => ele.label == Number(hours))
                temp.count++
            })
            break;
        }
        default: {
            attempts.forEach((ele) => {
                const hours = parseInt(ele.createdAt.split("T")[1].split(":")[0], 10) // can't use getHours() since it will try to set the time to local time zone adding extra hours but we don't need it since we are already doing it in the aggregation
                // console.log(ele.createdAt, hours)
                const temp = result.find((ele) => ele.label == Number(hours))
                temp.count++
            })
        }
    }

    res.json({
        result
    })
})

exports.lastSubmissions = tryCatch(async (req, res, next) => {
    const { limit = 10, page = 1 } = req.query
    const { userId } = req.user

    const subs = await Solution.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "questions",
                foreignField: "_id",
                localField: "questionId",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            serial: 1,
                            difficulty: 1
                        }
                    }
                ],
                as: "questionId"
            }
        },
        {
            $lookup: {
                from: "attempts",
                foreignField: "_id",
                localField: "solutions",
                let: { question: "$questionId" },
                pipeline: [
                    {
                        $project: {
                            code: 1,
                            success: 1,
                            createdAt: {
                                $dateFromString: {
                                    dateString: {
                                        $dateToString: {
                                            date: "$createdAt",
                                            timezone: "Asia/Kolkata"
                                        }
                                    },
                                }
                            }
                        }
                    },
                    {
                        $addFields: {
                            questionId: { $arrayElemAt: ["$$question._id", 0] },
                            questionTitle: { $arrayElemAt: ["$$question.title", 0] },
                            questionSerial: { $arrayElemAt: ["$$question.serial", 0] },
                            difficulty: { $arrayElemAt: ["$$question.difficulty", 0] }
                        }
                    },
                ],
                as: "solutions"
            }
        },
        {
            $addFields: {
                question: { $arrayElemAt: ["$questionId", 0] },
                attempt: "$solutions"
            }
        },
        {
            $project: {
                attempt: 1,
                question: 1
            }
        },
        {
            $unwind: "$attempt"
        },
        {
            $replaceWith: "$attempt"
        },
        {
            $facet: {
                data: [
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },
                    {
                        $skip: limit * (page - 1)
                    },
                    {
                        $limit: Number(limit)
                    }
                ],
                totalAttempts: [
                    {
                        $count: "count"
                    }
                ]
            }
        },
        {
            $project: {
                data: 1,
                totalAttempts : {$arrayElemAt : ["$totalAttempts.count", 0]}
            }
        }
    ])

    const totalPages = Math.ceil(subs[0].totalAttempts/limit)

    res.json({
        recentRecords : subs[0].data,
        totalPages,
        totalAttempts : subs[0].totalAttempts
    })
})