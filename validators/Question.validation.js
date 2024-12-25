const { checkSchema } = require('express-validator')

const isValidJson = (val) => {
    try {
        JSON.parse(val)
        return true
    } catch (error) {
        return false
    }
}

exports.createQuestionValidation = checkSchema({
    "title": {
        in: ['body'],
        exists: {
            errorMessage: "Title is missing"
        },
        notEmpty: {
            errorMessage: "Title is required"
        },
        trim: true
    },
    "question": {
        in: ['body'],
        exists: {
            errorMessage: "Question is missing"
        },
        notEmpty: {
            errorMessage: "question is required"
        }
    },
    "params": {
        in: ["body"],
        exists: {
            errorMessage: "Param's count is missing"
        },
        notEmpty: {
            errorMessage: "Param's count is required"
        },
        isInt: {
            errorMessage: "Params must be a valid Integer",
        },
        custom: {
            options: (value) => {
                if (value < 1) {
                    throw new Error("Params must be atleast 1")
                }

                return true
            }
        },
        toInt: true
    },
    "testCases": {
        in: ['body'],
        exists: {
            errorMessage: "Test cases are missing"
        },
        isArray: {
            errorMessage: "Test Cases must be an array"
        },
        custom: {
            options : (value) => {
                if(value.length == 0){
                    throw new Error("Test cases are required")
                }

                return true
            }
        }
    },
    "testCases.*.description": {
        in: ['body'],
        exists: {
            errorMessage: "Description for the Test case is missing"
        },
        notEmpty: {
            errorMessage: "Description can't be empty"
        },
        trim: true
    },
    "testCases.*.input": {
        in: ['body'],
        exists: {
            errorMessage: "Input for the Test case is missing"
        },
        notEmpty: {
            errorMessage: "Input can't be empty"
        },
        isArray: {
            errorMessage: "Input needs to be an array"
        },
        custom: {
            options: (value) => {
                for (let item of value) {
                    if (!isValidJson(item)) {
                        throw new Error("Value is not valid JSON")
                    }
                }
                return true
            }
        }
    },
    "testCases.*.output": {
        in: ["body"],
        exists: {
            errorMessage: "Output for the Test case is missing"
        },
        notEmpty: {
            errorMessage: "Output can't be empty"
        },
        // "isJSON" not sure how it works since its showing issues here
        custom: {
            options: (value) => {
                if (!isValidJson(value)) {
                    throw new Error("Value is not valid JSON")
                }
                return true
            }
        },
        trim: true
    },
    "tags": {
        in: ["body"],
        exists: {
            errorMessage: "Tags is missing"
        },
        notEmpty: {
            errorMessage: "Tags can't be empty"
        },
        isArray: {
            errorMessage: "Tags must be an array of values",
            options: {
                min: 1
            }
        },
        toArray: true
    },
    "difficulty": {
        in: ["body"],
        exists: {
            errorMessage: "Difficulty is missing"
        },
        notEmpty: {
            errorMessage: "Please provide a difficulty"
        },
        isIn: {
            options: [["easy", "medium", "hard"]],
            errorMessage: "Difficulty must be one of 'easy', 'medium', or 'hard'",
        }
    },
    "codeStructure": {
        in: ['body'],
        exists: {
            errorMessage: "Code Structure is missing"
        },
        notEmpty: {
            errorMessage: "Code Structure can't be empty"
        },
        custom: {
            options: (value) => {
                const functionRegex = /^(function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(.*?\)\s*\{.*?\}$|(?:const|let|var)?\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*(?:function\s*\(.*?\)\s*\{.*?\}|\(.*?\)\s*=>.*?));?$/s;

                if (!functionRegex.test(value)) {
                    throw new Error("Code Structure has invalid function signature")
                }

                return true
            }
        },
        trim: true
    }
})

exports.questionIDValidation = checkSchema({
    questionId: {
        in: ["query", "params"],
        exists: {
            errorMessage: "Please specify the question ID"
        },
        notEmpty: {
            errorMessage: "Question ID can't be empty"
        },
        isMongoId: {
            errorMessage: "Question ID is not a valid MONGO ID"
        },
        trim: true
    }
})