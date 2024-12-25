const { checkSchema } = require('express-validator')


exports.paginationValidation = checkSchema({
    page: {
        in: ["query"],
        custom: {
            options: (value) => {
                if (value < 1) {
                    throw new Error("Invalid page number")
                }
                return true
            }
        },
        trim: true,
        toInt: true,
        optional: {
            options: {
                values: "null"
            }
        }
    },
    limit: {
        in: ["query"],
        custom: {
            options: (value) => {
                if (value < 1) {
                    throw new Error("Limit is invalid")
                }
                return true
            }
        },
        toInt: true,
        optional: {
            options: {
                values: "null"
            }
        }
    },
    search: {
        in: ["query"],
        trim: true,
        optional: {
            options: {
                values: "null"
            }
        }
    },
    difficulty: {
        in: ["query"],
        isIn: {
            options: [["easy", "medium", "hard"]],
            errorMessage: "Difficulty must be one of 'easy', 'medium', or 'hard'",
        },
        trim: true,
        optional: {
            options: {
                values: "falsy"
            }
        }
    },
})