require('dotenv').config()
const ws = require('ws')
const express = require('express')
const app = express();
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken");
const fs = require('fs')



const jwtSecret = process.env.JWT_SECRET

const Message = require('./model/Message');

const connectToDb = require('./config/db')

connectToDb()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())



app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.use('/uploads', express.static(__dirname + '/uploads'))

const authRoutes = require("./routes/authRoutes")
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/message/', messageRoutes)

app.get('/', (req, res) => {
    res.send('HELLO FRONTEND')
})

const server = app.listen(4040)

const wss = new ws.WebSocketServer({ server })

wss.on('connection', (connection, req) => {
    const notifyAboutOnlinePeople = () => {
        [...wss.clients].forEach((client, index) => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
            }))
        })


    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            console.log(connection.username + 'dead');
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });


    // read username and id from cookie for this connection
    const cookies = req.headers.cookie

    if (cookies) {
        const token = cookies.split(';').find(str => str.startsWith('token=')).split('=')[1]

        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;

                const { userId, username } = userData

                connection.userId = userId
                connection.username = username

            })
        }

    }

    connection.on('message', async (message) => {

        const messageData = JSON.parse(message.toString())

        const { recipient, text, file } = messageData.message
        let filename = null
        if (file) {
            const parts = file.name.split('.')
            const ext = parts[parts.length - 1]
            filename = Date.now() + '.' + ext
            const path = __dirname + '/uploads/' + filename
            const bufferData = new Buffer(file.data.split(',')[1], 'base64')
            fs.writeFile(path, bufferData, () => {
                console.log('file saved:' + path)
            })
        }
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null
            });
            [...wss.clients]
                .filter(c => c.userId === recipient || c.userId === connection.userId)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    file: file ? filename : null,
                    _id: messageDoc._id
                })))
        }
    });

    // notify about everyone about online people (when someone connects)
    notifyAboutOnlinePeople()
})


