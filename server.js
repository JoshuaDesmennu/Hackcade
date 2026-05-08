const express = require("express");
const http = require("http");
const fs = require("fs");
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

function removeSocketFromRoom(socket) {
    rooms[socket.roomCode].sockets = rooms[socket.roomCode].sockets.filter(
        (s) => s != socket,
    );

    rooms[socket.roomCode].sockets.forEach((currentSocket) =>
        currentSocket.send(
            JSON.stringify({
                event: "newopponentlist",
                opponentNames: rooms[socket.roomCode].sockets
                    .filter((s) => s !== currentSocket)
                    .map((s) => s.displayName),
            }),
        ),
    );

    if (--rooms[socket.roomCode].numberOfPlayers === 0) {
        delete rooms[socket.roomCode];
        games[socket.gameName].totalRooms--;
    } else if (socket.isRoomLeader === true) {
        socket.isRoomLeader = false;
        rooms[socket.roomCode].sockets[0].isRoomLeader = true;
        rooms[socket.roomCode].sockets[0].send(
            JSON.stringify({
                event: "leader",
            }),
        );
    }
    socket.isConnected = false;
    socket.roomCode = null;
}

wss.on("connection", (socket) => {
    console.log("Just got a new connection");
    socket.on("message", (data) => {
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch {
            return;
        }
        if (jsonData["event"] === "roomconnect") {
            // deny if fields are too long or short
            if (
                jsonData["roomCode"].length <= 0 ||
                jsonData["roomCode"].length > 30 ||
                jsonData["displayName"].length <= 0 ||
                jsonData["displayName"].length > 30
            ) {
                socket.send(
                    JSON.stringify({
                        event: "roomnotconnected",
                        reason: "invalid field lengths",
                    }),
                );
                return;
            }
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
                return;
            }
            let room = rooms[jsonData["roomCode"]];
            // deny access if room already exists with a different game
            if (room != null) {
                if (
                    room.gameName != null &&
                    room.gameName !== jsonData["gameName"]
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
                    room.numberOfPlayers >=
                    games[jsonData["gameName"]].maxPlayersPerRoom
                ) {
                    socket.send(
                        JSON.stringify({
                            event: "roomnotconnected",
                            reason: "room full",
                        }),
                    );
                    return;
                }
            }

            // if this socket is connected, but wants to change rooms
            if (
                socket.isConnected == true &&
                socket.roomCode != jsonData["roomCode"]
            ) {
                removeSocketFromRoom(socket);
            }
            // update or create room with new info
            rooms[jsonData["roomCode"]] = {
                ...room,
                roomCode: jsonData["roomCode"],
                numberOfPlayers: room == null ? 1 : room.numberOfPlayers + 1,
                gameName: jsonData["gameName"],
            };

            room = rooms[jsonData["roomCode"]];
            // if this socket is the first person in the room, make it leader
            if (room.numberOfPlayers == 1) {
                room.gameState = jsonData["initialState"];
                socket.isRoomLeader = true;
                games[jsonData["gameName"]].totalRooms++;
            }

            socket.roomCode = jsonData["roomCode"];
            socket.isConnected = true;
            socket.displayName = jsonData["displayName"];
            socket.gameName = jsonData["gameName"];

            if (room.sockets == null) {
                room.sockets = [socket];
                socket.isTurn = true;
            } else {
                socket.isTurn = !room.sockets[0].isTurn;
                room.sockets.push(socket);
            }

            socket.send(
                JSON.stringify({
                    event: "roomconnected",
                    roomCode: jsonData["roomCode"],
                    numberOfPlayers: room.numberOfPlayers,
                    gameState: room.gameState,
                    isTurn: socket.isTurn,
                    opponentNames: room.sockets
                        .filter((s) => s !== socket)
                        .map((s) => s.displayName),
                    isRoomLeader: socket.isRoomLeader,
                }),
            );
        } else if (jsonData["event"] == "broadcastroom") {
            const room = rooms[jsonData["roomCode"]];
            if (room == null) return;
            if (
                room.sockets != null &&
                socket.roomCode === jsonData["roomCode"]
            ) {
                room.sockets
                    .filter((s) => s != socket)
                    .forEach((s) => {
                        s.send(JSON.stringify(jsonData["body"]));
                    });
            }
        } else if (jsonData["event"] == "updatestate") {
            const room = rooms[jsonData["roomCode"]];
            if (room == null) return;
            if (
                jsonData["gameState"] != null &&
                jsonData["gameState"].board != null &&
                jsonData["gameState"].currentPlayer != null &&
                jsonData["gameState"].isWon != null &&
                jsonData["roomCode"] === socket.roomCode
            ) {
                socket.isTurn = jsonData["isTurn"];
                room.sockets
                    .filter((s) => s != socket)
                    .forEach((s) => {
                        s.isTurn = !socket.isTurn;
                    });
                room.gameState = jsonData["gameState"];
            }
        } else if (jsonData["event"] == "leaveroom") {
            if (socket.isConnected === true) {
                removeSocketFromRoom(socket);
            }
        }
    });

    socket.on("close", (code) => {
        console.log(`Disconnected with code ${code}`);
        if (socket.isConnected === true) {
            removeSocketFromRoom(socket);
        }
    });
});

app.use(express.static("static"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home", { title: "Home", games: games });
});

app.get("/how2play", (req, res) => {
    res.render("how2play", { title: "How To Play" });
});

app.get("/about", (req, res) => {
    res.render("about.ejs", {title: "About"})
})

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

app.use((req, res) => {
    res.render("nope.ejs", { title: "404"});
});

server.listen(3000, "0.0.0.0");
