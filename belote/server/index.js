const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Player = require("./classes/Player");
const Room = require("./classes/Room");
const Game = require("./classes/Game");
const { getBiddingResult, startPlayingRound, cardLibrary } = require("./logic");

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const MAX_ROOMS = 50;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const activeRooms = new Map();

// Helper function to sanitize inputs
function sanitizeInput(str, maxLength = 50) {
  if (!str || typeof str !== "string") return "";
  return str.trim().substring(0, maxLength);
}

io.on("connection", (socket) => {
  console.log(`User connected -- ${socket.id}`);
  const user = new Player(socket.id);

  socket.on("join_room", (data) => {
    try {
      const playerName = sanitizeInput(data.playerName, 30);
      const roomID = sanitizeInput(data.roomID, 20);

      if (!playerName || !roomID) {
        socket.emit("error", { message: "Invalid input" });
        return;
      }

      user.setName(playerName);
      const users = io.sockets.adapter.rooms.get(roomID);

      if (users === undefined || (users && users.size <= 3)) {
        let room;

        // Check max rooms limit
        if (activeRooms.size >= MAX_ROOMS && !activeRooms.has(roomID)) {
          socket.emit("room_full", { message: "Server is full" });
          return;
        }

        if (!activeRooms.has(roomID)) {
          room = new Room(roomID);
          room.owner = user;
          room.lastActivity = Date.now();
          activeRooms.set(roomID, room);
        } else {
          room = activeRooms.get(roomID);
          room.lastActivity = Date.now();
        }

        socket.join(roomID);
        user.joinRoom(roomID);
        room.addPlayer(user);

        io.to(room.roomID).emit("update_room", room);
        io.to(socket.id).emit("set_room", room);
      } else {
        socket.emit("room_full");
      }
    } catch (error) {
      console.error("Error in join_room:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("start_game", (room) => {
    try {
      const game = new Game(room);
      game.setTeams();
      game.createDeck();
      game.shuffleDeck();

      io.to(room.roomID).emit("receiveGameData", game);
      io.to(room.roomID).emit("setup_game");
    } catch (error) {
      console.error("Error in start_game:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("deal_5_cards", (gameData) => {
    try {
      const game = new Game(gameData.room);
      game.fullDeck = gameData.fullDeck;
      game.team1 = gameData.team1;
      game.team2 = gameData.team2;
      game.roundNumber = gameData.roundNumber;
      game.deal5Cards();
      io.to(game.room.roomID).emit("deal_first_cards", game);
    } catch (error) {
      console.error("Error in deal_5_cards:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("deal_3_cards", (stateData) => {
    try {
      const gameData = stateData.game;
      const game = new Game(gameData.room);
      game.fullDeck = gameData.fullDeck;
      game.team1 = gameData.team1;
      game.team2 = gameData.team2;
      game.roundNumber = gameData.roundNumber;
      game.deal3Cards();
      game.sortHands(stateData.roundBiddingInfo.gameBid);
      io.to(game.room.roomID).emit("deal_second_cards", game);
    } catch (error) {
      console.error("Error in deal_3_cards:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("request_bids", (gameData) => {
    try {
      const game = new Game(gameData.room);
      game.fullDeck = gameData.fullDeck;
      game.team1 = gameData.team1;
      game.team2 = gameData.team2;
      game.roundNumber = gameData.roundNumber;
      getBiddingResult(game, io);
    } catch (error) {
      console.error("Error in request_bids:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("play_round", (stateData) => {
    try {
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
    } catch (error) {
      console.error("Error in play_round:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("end_round", (gameData) => {
    try {
      const game = new Game(gameData.room);
      game.fullDeck = gameData.fullDeck;
      game.team1 = gameData.team1;
      game.team2 = gameData.team2;
      game.roundNumber = gameData.roundNumber;
      game.resetDeck();
      game.incrementRoundNumber();
      game.rotatePlayersAndClearHands();
      io.to(game.room.roomID).emit("reset_game", game);
    } catch (error) {
      console.error("Error in end_round:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("end_game", (gameData) => {
    try {
      const game = new Game(gameData.room);
      game.fullDeck = [];
      game.team1 = gameData.team1;
      game.team2 = gameData.team2;
      game.roundNumber = gameData.roundNumber;
      game.rotatePlayersAndClearHands();

      io.to(game.room.roomID).emit("display_winner", game);
    } catch (error) {
      console.error("Error in end_game:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("end_room", (gameData) => {
    try {
      io.to(gameData.room.roomID).emit("room_ended", gameData.room);
      socket.leave(gameData.room.roomID);
      if (activeRooms.has(gameData.room.roomID)) {
        activeRooms.delete(gameData.room.roomID);
      }
    } catch (error) {
      console.error("Error in end_room:", error);
      socket.emit("error", { message: "Something went wrong" });
    }
  });

  socket.on("disconnect", () => {
    try {
      const room = activeRooms.get(user.roomID);
      if (room) {
        room.removePlayer(user);
        io.to(room.roomID).emit("update_room", room);
        if (room.players.length === 0) {
          activeRooms.delete(user.roomID);
        }
      }
      user.leaveRoom();

      console.log(`User disconnected -- ${socket.id}`);
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
});

// Clean up inactive rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [roomID, room] of activeRooms.entries()) {
    if (
      room.players.length === 0 ||
      (room.lastActivity && now - room.lastActivity > 30 * 60 * 1000)
    ) {
      activeRooms.delete(roomID);
      console.log(`Cleaned up inactive room: ${roomID}`);
    }
  }
}, 5 * 60 * 1000);
