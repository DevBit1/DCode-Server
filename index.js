require('dotenv').config({
    path: "./config/.env"
})

const express = require('express')
const connectDb = require('./config/connectDb')
const { errorMw } = require('./middlewares/errorMiddleware')
const questionRoutes = require('./routes/question.routes')
const adminRoutes = require('./routes/Admin/admin.routes')
const userRoutes = require('./routes/User/user.routes')
const solutionRoutes = require('./routes/solution.routes')
const requestRoutes = require('./routes/request.routes')
const cors = require('cors')
const cookieParser = require("cookie-parser")
const { createServer } = require("http")
const { init } = require('./Socket Handlers/onConnection')



const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
];

const port = process.env.PORT || 3000
const app = express()
const server = createServer(app)

// Socket initialization
init(server)


//MiddleWares that are necessary
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))



//routes mounting
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1', questionRoutes)
app.use('/api/v1', solutionRoutes)
app.use('/api/v1', requestRoutes)


app.get('/', (req, res) => {
    res.send("Hello")
})

connectDb()


app.use(errorMw)

server.listen(port, () => {
    console.log(`Server started at ${port}`)
})


