const Tag = require("../../models/tags.model")
const tryCatch = require("../../utils/tryCatch")

exports.createTag = tryCatch(async (req, res, next) => {
    const { name } = req.body
    // const { multi = false } = req.query

    const result = await Tag.create({ name : name.toLowerCase().trim() })

    res.status(201).json({
        success: true,
        result
    })

})