const { ADMIN_CREATE_CLASS, ADMIN_CLOSE_CLASS } = require('../Constants/socketEvents');
const authHandler = require('./authHandler');
const Y = require('yjs');


let io;

const users = new Map()
let adminSocketID = ""

const document = new Map() // Stores data about each room , such as creator, Y.Doc() and all the members


const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
];

function init(server) {
    if (!io) {
        const { Server } = require('socket.io');
        io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true
            }
        });

        io.use(authHandler)

        // io.of("/").adapter.on("create-room", (room) => {
        //     console.log(`Room - ${room} created`)
        // })

        io.of("/").adapter.on("leave-room", (room, id) => {
            console.log(`socket ${id} has left the room - ${room}`);
        })

        io.on("connection", (socket) => {

            const { userId } = socket.data.user


            console.log(`${socket.data.user.name} - ${socket.id} connected to the server`)

            // Doesn't support multi-socket per user
            if (socket.data.user.role == "creator") {
                adminSocketID = socket.id
            }
            else {
                users.set(userId, socket.id)
            }

            roomHandling(socket)

            // After admin login every time a new user joins the whole map is sent look for optimization here
            // In this case admin will now no longer get his/her own online status
            if (adminSocketID) {
                // console.log("Online emitted")
                io.to(adminSocketID).emit("online-users", [...users.keys()])
            }

            // Same problem here after every delete
            socket.on("disconnect", () => {
                console.log(`${socket.data.user.name} disconnected from the server`)
                if (socket.id == adminSocketID) {
                    adminSocketID = ""
                }
                else {
                    users.delete(userId)

                    // Making the user leave all the joined rooms
                    document.forEach((value, key) => {
                        socket.leave(key)
                        value.clients.delete(socket.id)
                    })
                }



                if (adminSocketID) {
                    io.to(adminSocketID).emit("online-users", [...users.keys()])
                }
            })
        })
    }
    return io;
}

function roomHandling(socket) {

    if (socket.data.user.role == "creator") {
        socket.on(ADMIN_CREATE_CLASS, (room) => {
            // Manage avoiding duplicacy of room Names through the api
            socket.join(room)
            if (document.has(room)) {
                document.get(room).creator = socket.id
            }
            else {
                document.set(room, {
                    doc: new Y.Doc(), // Each room will have its own Doc()
                    clients: new Set(),
                    creator: socket.id
                })
            }
            console.log(`${socket.data.user.name} created Room - ${room}`)
            // console.log(document)
        })

        // needs further upgrades
        socket.on(ADMIN_CLOSE_CLASS, async (room) => {
            // Explicitly disconnect all users
            const socketsInRoom = await io.in(room).fetchSockets();

            io.to(room).emit(`leave-room-${room}`) // This makes all users redirect to their main page

            socketsInRoom.forEach((socket) => {
                socket.leave(room); // Make the socket leave the room
            });


            document.delete(room)
            console.log(`${socket.data.user.name} deleted Room - ${room}`)
        })
    }

    // Update based on rooms
    socket.on("update", (state, room) => {

        // console.log(state)
        let update = new Uint8Array(state)
        let sharedDoc = document.get(room).doc
        Y.applyUpdate(sharedDoc, update)

        io.to(room).except(socket.id).emit(`update:${room}`, update) // Room specific update, which will help us clean up the listeners, avoiding memory leaks
    })

    // Room-based initial state
    socket.on("initialSync", (room) => {
        // const sharedDoc = document.get(room).doc

        // socket.emit(`initialSync:${room}`, Y.encodeStateAsUpdate(sharedDoc)) // Room-specific emit
        const roomData = document.get(room);
        if (!roomData) {
            console.error(`Room ${room} does not exist.`);
            return;
        }

        const sharedDoc = roomData.doc;

        if (!sharedDoc) {
            console.error(`No shared document found for room ${room}.`);
            return;
        }

        const stateUpdate = Y.encodeStateAsUpdate(sharedDoc);
        // console.log(stateUpdate)
        socket.emit(`initialSync:${room}`, stateUpdate)

    })


    socket.on("join-room", (room) => {

        // console.log(room)

        if (!document.has(room)) {
            console.error(`Room - ${room} doesn't exist`)
            throw new Error("Room doesn't exist")
        }
        else {
            document.get(room).clients.add(socket.id)
            socket.join(room)
            console.log(`${socket.data.user.name} joined Room - ${room}`)
        }
    })

    socket.on("leave-room", (room) => {
        socket.leave(room)
        document.get(room).clients.delete(socket.id)
        console.log(`${socket.data.user.name} has left the Room - ${room}`)
    })

}

function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized! Call init(server) first.');
    }
    return io;
}

const getOnlineUsers = () => {
    return users
}

module.exports = { init, getIO, getOnlineUsers };

