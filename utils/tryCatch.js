// This function only catches error which are not user defined such as system error , db error etc..
// Bcs user defined errors will be passed to "next" directly from inside the function

// "catch" inherently takes a callback function as an argument so when given "next" it acts as the callback function which is called with the "error"
// This is the reason why we haven't called next(error) like this
const tryCatch = (aFunction) => {
    return (req, res, next) => {
        Promise.resolve(aFunction(req, res, next)).catch(next)
    }
}

module.exports = tryCatch