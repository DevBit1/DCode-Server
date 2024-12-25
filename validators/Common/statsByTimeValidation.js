const { checkSchema } = require("express-validator");


exports.statsByTimeValidation = checkSchema({
    order: {
        in: ['query'],
        notEmpty: {
            errorMessage: "Order can't be empty if specified"
        },
        isIn: {
            options: [["week", "day", "year"]],
            errorMessage: "Order can have only 'year'/'day'/'week' as values"
        },
        trim: true,
        toLowerCase: true
    },
    year: {
        in: ['query'],
        notEmpty: {
            errorMessage: "Year can't be empty if specified"
        },
        custom: {
            options: (value) => {
                const year = parseInt(value, 10); // Convert value to an integer

                if (isNaN(year)) {
                    throw new Error("Year must be a valid number");
                }

                if (year < 2024) {
                    throw new Error("There are no records before 2024");
                }

                if (year > new Date().getFullYear()) {
                    throw new Error("Can't fetch records from the future");
                }

                return true;
            }
        },
        optional: {
            options: {
                values: "null"
            }
        },
        trim: true,
        toInt: true
    },
    month: {
        in: ['query'],
        notEmpty: {
            errorMessage: "Month can't be empty if specified"
        },
        custom: {
            options: (value) => {
                if (!(value >= 1 && value <= 12)) {
                    throw new Error("Invalid month")
                }
                return true
            }
        },
        optional: {
            options: {
                values: "falsy"
            }
        },
        trim: true,
        toInt: true
    }
})