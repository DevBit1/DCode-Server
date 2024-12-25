const Tag = require("../../models/tags.model")
const tryCatch = require("../../utils/tryCatch")


exports.getAllTags = tryCatch(async (req, res, next) => {

    // The below 2 will give the same result
    let result = await Tag.find({}, { name: 1 })
    // let result = await Tag.find({}).select("name")

    // This will give "name" field included with other default fields such as "_id" "createdAt" "updatedAt"...
    // const result = await Tag.find({}).select("+name") 


    // result = result.map((ele) => ele.name)

    res.json({
        success: true,
        result
    })
})