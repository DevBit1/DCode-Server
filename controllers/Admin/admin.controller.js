const tryCatch = require("../../utils/tryCatch")
const { customError } = require("../../middlewares/errorMiddleware")
const User = require("../../models/user.model")
const Question = require("../../models/question.model")
const TestCase = require("../../models/test.model")
const Attempt = require("../../models/attempt.model")
const Solution = require("../../models/solution.model")
const { sendToken } = require("../../utils/sendToken")
const { getDaysInMonth, getDay, getMonth, getDate, getHours } = require("date-fns");

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


exports.createUser = tryCatch(async (req, res, next) => {
    const { name, email } = req.body

    if (!name || !email) {
        return next(new customError("Insufficient Data", 400))
    }

    const password = crypto.randomUUID(10).slice(0, 10)

    const user = await User.create({
        name,
        email,
        password,
        isFirstLogin: true
    })

    const totalQuestions = await Question.countDocuments()


    console.log(user)
    await user.sendMail(email, name, password)

    return res.status(201).json({
        success: true,
        message: "User created successfully",
        user,
        totalQuestions
    })

})


// Make it capable of search and pagination
exports.getAllUsers = tryCatch(async (req, res, next) => {

    const { page = 1, limit = 10, search = "" , order = "asc"} = req.query

    const totalQuestions = await Question.countDocuments({})

    const users = await User.aggregate([
        {
            $match: {
                $and: [
                    { role: "solver" },
                    search ? { name: { $regex: search, $options: "i" } } : {}
                ]
            }
        },
        {
            $facet: {
                data: [
                    {
                        $lookup: {
                            from: "solutions",
                            foreignField: "userId",
                            localField: "_id",
                            as: "solution"
                        }
                    },
                    {
                        $addFields: {
                            solvedQuestions: {
                                $size: {
                                    $filter: {
                                        input: "$solution",
                                        as: "item",
                                        cond: { $eq: ["$$item.isSolved", true] }
                                    }
                                }
                            },
                            attemptedQuestions: { $size: "$solution" },
                        }
                    },
                    {
                        $addFields: {
                            notAttemptedQuestions: { $subtract: [totalQuestions, "$attemptedQuestions"] }
                        }
                    },
                    {
                        $project: {
                            solution: 0,
                            password: 0
                        }
                    },
                    {
                        $sort : {
                            createdAt : order == "asc" ? 1 : -1
                        }
                    },
                    {
                        $skip: limit * (page - 1)
                    },
                    {
                        $limit: Number(limit)
                    }
                ],
                totalUsers: [
                    {
                        $count: "count"
                    }
                ]
            }
        },
        {
            $project: {
                data: 1,
                totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] }
            }
        }
    ])

    const totalPages = Math.ceil(users[0].totalUsers / limit)

    res.json({
        success: true,
        message: "Retreived all users",
        users: users[0].data,
        totalPages,
        totalUsers: users[0].totalUsers
    })
})


// DashBoard controllers

exports.basicStats = tryCatch(async (req, res, next) => {

    const [
        totalUsers,
        totalQuestions,
        totalSolvedQuestions,
        totalTestCases,
        totalSubmissions,
        totalSuccessfullSubmissions
    ] = await Promise.all([
        User.countDocuments({ role: "solver" }),
        Question.countDocuments(),
        Solution.countDocuments({ isSolved: true }),
        TestCase.countDocuments(),
        Attempt.countDocuments(),
        Attempt.countDocuments({ success: true })
    ])



    const result = {
        totalUsers,
        totalQuestions,
        totalSolvedQuestions,
        totalTestCases,
        totalSubmissions,
        totalSuccessfullSubmissions
    }


    res.status(200).json({
        success: true,
        result
    })

})

exports.statsByDate = tryCatch(async (req, res, next) => {
    // "week", "day","year" -> to get month specific "order = year" , "year = YYYY"(optional) and "month = M(1-12)"
    const { order = "week", year = new Date().getFullYear().toString(), month = "" } = req.query

    let to = new Date()
    let from = new Date(to)
    let result = []

    // console.log(year, month)

    // This sets our "from" and "to"
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



    console.table([{ from: from.toLocaleString(), to: to.toLocaleString(), result: result.length, order }])

    // This returns all the "attempts" within our range
    const attempts = await Attempt.aggregate([
        {
            $match: {
                $expr: {
                    $and: [
                        { $gte: ["$createdAt", from] },
                        { $lte: ["$createdAt", to] } // This is added in case of order = "year", and for specific months
                    ]
                }
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        },
        {
            $project: {
                createdAt: {
                    $dateToString: {
                        date: "$createdAt",
                        timezone: "Asia/Kolkata"
                    }
                }
            }
        }
    ])

    // console.log(attempts)


    // This fills in our "result" array
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
        success: true,
        message: "Here are the stats",
        result
    })
})


