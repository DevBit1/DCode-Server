const mongoose = require('mongoose')

const connectDb = () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName:"coding"
    }).then((data) => {
        console.log(`Connected to ${data.connection.host}`)
    }).catch((err) => {
        console.error(err)
    })
}

module.exports = connectDb