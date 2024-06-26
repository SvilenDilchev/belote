const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Player = require('./classes/Player');
const Room = require('./classes/Room');
const Game = require('./classes/Game');
const { getBiddingResult, startPlayingRound, cardLibrary } = require('./logic');

const PORT = 3001;
const CLIENT_ORIGIN = 'http://localhost:3000';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const activeRooms = new Map();

io.on('connection', (socket) => {
    console.log(`User connected -- ${socket.id}`);
    const user = new Player(socket.id);

    socket.on('join_room', (data) => {
        user.setName(data.playerName);
        const users = io.sockets.adapter.rooms.get(data.roomID);

        if (users === undefined || (users && users.size <= 3)) {
            let room;
            if (!activeRooms.has(data.roomID)) {
                room = new Room(data.roomID);
                room.owner = user;
                activeRooms.set(data.roomID, room);
            } else {
                room = activeRooms.get(data.roomID);
            }

            socket.join(data.roomID);
            user.joinRoom(data.roomID);
            room.addPlayer(user);

            io.to(room.roomID).emit('update_room', room);
            io.to(socket.id).emit('set_room', room);
            //socket.to(data.roomID).emit('update_players', room.players);
        } else {
            socket.emit('room_full');
        }
    });

    socket.on('start_game', (room) => {
        const game = new Game(room);
        game.setTeams();
        game.createDeck();
        game.shuffleDeck();

        io.to(room.roomID).emit('receiveGameData', game);
        io.to(room.roomID).emit('setup_game');
    });

    socket.on('deal_5_cards', (gameData) => {
        const game = new Game(gameData.room);
        game.fullDeck = gameData.fullDeck;
        game.team1 = gameData.team1;
        game.team2 = gameData.team2;
        game.roundNumber = gameData.roundNumber;
        game.deal5Cards();
        io.to(game.room.roomID).emit('deal_first_cards', game);
    });

    socket.on('deal_3_cards', (stateData) => {
        const gameData = stateData.game;
        const game = new Game(gameData.room);
        game.fullDeck = gameData.fullDeck;
        game.team1 = gameData.team1;
        game.team2 = gameData.team2;
        game.roundNumber = gameData.roundNumber;
        game.deal3Cards();
        game.sortHands(stateData.roundBiddingInfo.gameBid);
        io.to(game.room.roomID).emit('deal_second_cards', game);
    });

    socket.on('request_bids', (gameData) => {
        const game = new Game(gameData.room);
        game.fullDeck = gameData.fullDeck;
        game.team1 = gameData.team1;
        game.team2 = gameData.team2;
        game.roundNumber = gameData.roundNumber;
        getBiddingResult(game, io);
    });

    socket.on('play_round', (stateData) => {
        const gameData = stateData.game;
        const game = new Game(gameData.room);
        game.fullDeck = gameData.fullDeck;
        game.team1 = gameData.team1;
        game.team2 = gameData.team2;
        game.roundNumber = gameData.roundNumber;
        game.hangingPoints = gameData.hangingPoints;

        let gameBid = stateData.roundBiddingInfo.gameBid;

        // Remove the last 3 characters if the gameBid ends with " x2" or " x4"
        if (gameBid.endsWith(" x2") || gameBid.endsWith(" x4")) {
            gameBid = gameBid.slice(0, -3);
        }

        game.roundBid = gameBid;
        game.roundBidder = stateData.roundBiddingInfo.biddingPlayer;
        game.roundMultiplier = stateData.roundBiddingInfo.multiplier;

        startPlayingRound(game, io);
    });

    socket.on('end_round', (gameData) => {
        const game = new Game(gameData.room);
        game.fullDeck = gameData.fullDeck;
        game.team1 = gameData.team1;
        game.team2 = gameData.team2;
        game.roundNumber = gameData.roundNumber;
        game.resetDeck();
        game.incrementRoundNumber();
        game.rotatePlayersAndClearHands();
        io.to(game.room.roomID).emit('reset_game', game);
    });

    socket.on('end_game', (gameData) => {
        const game = new Game(gameData.room);
        game.fullDeck = [];
        game.team1 = gameData.team1;
        game.team2 = gameData.team2;
        game.roundNumber = gameData.roundNumber;
        game.rotatePlayersAndClearHands();

        io.to(game.room.roomID).emit('display_winner', game);
    });

    socket.on('end_room', (gameData) => {
        io.to(gameData.room.roomID).emit('room_ended', gameData.room);
        socket.leave(gameData.room.roomID);
        if(activeRooms.has(gameData.room.roomID)){
            activeRooms.delete(gameData.room.roomID);
        }
    });
    

    socket.on('disconnect', () => {
        const room = activeRooms.get(user.roomID);
        if (room) {
            room.removePlayer(user);
            io.to(room.roomID).emit('update_room', room);
            //io.to(room.roomID).emit('update_players', room.players);
            if (room.players.length === 0) {
                activeRooms.delete(user.roomID);
            }
        }
        user.leaveRoom();

        console.log(`User disconnected -- ${socket.id}`);
    });
});
