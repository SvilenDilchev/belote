const express = require('express')
const path = require('path')
const Lobby = require('./public/js/classes/Lobby')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 4000

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

app.get('/lobby/:code', (req, res) => {
    res.sendFile(__dirname + '/public/lobby.html')
})

const allBackEndPlayers = {}
const lobbies = {}

io.on('connection', (socket) => {
    console.log('a user connected')
    allBackEndPlayers[socket.id] = {
        id: socket.id,
    }

    io.emit('updatePlayers', allBackEndPlayers)

    socket.on('disconnect', (reason) => {
        console.log('a user disconnected -- ' + reason)
        delete allBackEndPlayers[socket.id]
        io.emit('updatePlayers', allBackEndPlayers)
    })

    socket.on('createLobby', () => {
        const lobby = new Lobby();
        lobby.addPlayer(allBackEndPlayers[socket.id]);
        lobbies[lobby.code] = lobby;
        socket.join(lobby.code);
        io.to(lobby.code).emit('enterLobby', lobby, allBackEndPlayers[socket.id])
        io.to(lobby.code).emit('test', lobby)
    })

    socket.on('joinLobby', (lobbyCode) => {
        const lobby = lobbies[lobbyCode];
        if (lobby) {
            socket.join(lobby.code);
            lobby.addPlayer(allBackEndPlayers[socket.id]);
            io.to(lobby.code).emit('enterLobby', lobby, allBackEndPlayers[socket.id]);
        } else {
            // Handle case when lobby with the specified lobby code is not found
        }
    })

    console.log(allBackEndPlayers)
})

server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
})

console.log('server did load')

