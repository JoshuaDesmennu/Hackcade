const express = require("express");
const http = require("http");
const websocket = require("ws");
const app = express();

const server = http.createServer(app);
const wss = new websocket.Server({ server });

let games = {
    checkers: {
        name: "Checkers",
        maxPlayersPerRoom: 2,
        totalRooms: 0,
    },
    tictactoe: {
        name: "TicTacToe",
        maxPlayersPerRoom: 2,
        totalRooms: 0,
    },
};

let rooms = {};
/**
 * The structure for each member is
 * Room code: Room code
 * number of players
 * game name
 */

wss.on("connection", (socket) => {
    console.log("Just got a new connection");
    socket.on("message", (data) => {
        const jsonData = JSON.parse(data);
        if (jsonData["event"] === "roomconnect") {
            // deny connection if already connected
            if (
                socket.isConnected === true &&
                socket.roomCode == jsonData["roomCode"]
            ) {
                socket.send(
                    JSON.stringify({
                        event: "roomnotconnected",
                        reason: "already connected",
                    }),
                );
            }
            // deny access if room alr exists with a different game
            if (rooms[jsonData["roomCode"]] != null) {
                if (
                    rooms[jsonData["roomCode"]].gameName != null &&
                    rooms[jsonData["roomCode"]].gameName !==
                        jsonData["gameName"]
                ) {
                    socket.send(
                        JSON.stringify({
                            event: "roomnotconnected",
                            reason: "room occupied",
                        }),
                    );
                    return;
                }

                // deny access if room is full
                if (
                    rooms[jsonData["roomCode"]].numberOfPlayers >=
                    games[jsonData["gameName"]].maxPlayersPerRoom
                ) {
                    socket.send(
                        JSON.stringify({
                            event: "roomnotconneted",
                            reason: "room full",
                        }),
                    );
                    return;
                }
            }

            if (
                socket.isConnected == true &&
                socket.roomCode != jsonData["roomCode"]
            ) {
                rooms[socket.roomCode].sockets = rooms[
                    socket.roomCode
                ].sockets.filter((s) => s != socket);
                
                socket.isRoomLeader = false;
                if (--rooms[socket.roomCode].numberOfPlayers === 0) {
                    rooms[socket.roomCode] = null;
                    games[socket.gameName].totalRooms--;
                } else {
                    rooms[socket.roomCode].sockets[0].isRoomLeader = true;
                }

            }
            // update or create room with new info
            rooms[jsonData["roomCode"]] = {
                ...rooms[jsonData["roomCode"]],
                roomCode: jsonData["roomCode"],
                numberOfPlayers:
                    rooms[jsonData["roomCode"]] == null
                        ? 1
                        : rooms[jsonData["roomCode"]].numberOfPlayers + 1,
                gameName: jsonData["gameName"],
            };

            if (rooms[jsonData["roomCode"]].numberOfPlayers == 1) {
                rooms[jsonData["roomCode"]].gameState =
                    jsonData["initialState"];
                socket.isRoomLeader = true;
                games[jsonData["gameName"]].totalRooms++;
            }

            socket.roomCode = jsonData["roomCode"];
            socket.isConnected = true;
            socket.displayName = jsonData["displayName"];
            socket.gameName = jsonData["gameName"];

            if (rooms[jsonData["roomCode"]].sockets == null) {
                rooms[jsonData["roomCode"]].sockets = [socket];
                socket.isTurn = true;
            } else {
                socket.isTurn = !rooms[jsonData["roomCode"]].sockets[0].isTurn;
                rooms[jsonData["roomCode"]].sockets.push(socket);
            }

            socket.send(
                JSON.stringify({
                    event: "roomconnected",
                    roomCode: jsonData["roomCode"],
                    numberOfPlayers:
                        rooms[jsonData["roomCode"]].numberOfPlayers,
                    gameState: rooms[jsonData["roomCode"]].gameState,
                    isTurn: socket.isTurn,
                    opponentName:
                        rooms[jsonData["roomCode"]].sockets.length > 1
                            ? rooms[jsonData["roomCode"]].sockets.filter(
                                  (s) => s !== socket,
                              )[0].displayName
                            : "Nobody",
                    isRoomLeader: socket.isRoomLeader,
                }),
            );
        } else if (jsonData["event"] == "broadcastroom") {
            if (rooms[jsonData["roomCode"]].sockets != null) {
                rooms[jsonData["roomCode"]].sockets
                    .filter((s) => s != socket)
                    .forEach((s) => {
                        s.send(JSON.stringify(jsonData["body"]));
                    });
            }
        } else if (jsonData["event"] == "updatestate") {
            if (
                jsonData["gameState"] != null &&
                jsonData["gameState"].board != null &&
                jsonData["gameState"].currentPlayer != null &&
                jsonData["gameState"].isWon != null
            ) {
                socket.isTurn = jsonData["isTurn"];
                rooms[jsonData["roomCode"]].sockets
                    .filter((s) => s != socket)
                    .forEach((s) => {
                        s.isTurn = !socket.isTurn;
                    });
                rooms[jsonData["roomCode"]].gameState = jsonData["gameState"];
            }
        } else if (jsonData["event"] == "leaveroom") {
            if (socket.isConnected === true) {
                rooms[socket.roomCode].sockets = rooms[
                    socket.roomCode
                ].sockets.filter((s) => s != socket);

                socket.isRoomLeader = false;
                if (--rooms[socket.roomCode].numberOfPlayers === 0) {
                    rooms[socket.roomCode] = null;
                    games[socket.gameName].totalRooms--;
                } else {
                    rooms[socket.roomCode].sockets[0].isRoomLeader = true;
                }
                socket.isConnected = false;
                socket.roomCode = null;
            }
        }
    });

    socket.on("close", (code) => {
        console.log(`Disconnected with code ${code}`);
        if (socket.isConnected === true) {
            rooms[socket.roomCode].sockets = rooms[
                socket.roomCode
            ].sockets.filter((s) => s != socket);

            socket.isRoomLeader = false;
            if (--rooms[socket.roomCode].numberOfPlayers === 0) {
                rooms[socket.roomCode] = null;
                games[socket.gameName].totalRooms--;
            } else {
                rooms[socket.roomCode].sockets[0].isRoomLeader = true;
            }

            socket.isConnected = false;
            socket.roomCode = null;
        }
    });
});

app.use(express.static("static"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home", { title: "Home", games: games });
});

app.get("/numberinroom/:roomCode", (req, res) => {
    if (rooms[req.params.roomCode] == null) {
        res.json({
            event: "numberinroomfailed",
            reason: "room not existing",
        });
    } else {
        res.json({
            event: "givenumberinroom",
            number: rooms[req.params.roomCode].numberOfPlayers,
        });
    }
});

const gamesRouter = require("./routes/games");
app.use("/games", gamesRouter);

server.listen(3000, "0.0.0.0");
