const { checkSchema } = require("express-validator");


exports.solutionValidation = checkSchema({
    code: {
        in: ['body'],
        exists: {
            errorMessage: "Code is missing for the attempt"
        },
        notEmpty: {
            errorMessage: "Can't save blank code"
        },
        trim: true
    },
    testResults: {
        in: ["body"],
        exists:{
            errorMessage:"Test results for the code is missing"
        }
    }
})