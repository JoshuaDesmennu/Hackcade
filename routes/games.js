const express = require("express")
const router = express.Router();

router.get("/tictactoe", (req, res) => {
    res.render("tictactoe", {
        title: "TicTacToe",
    });
})

router.get("/checkers", (req, res) => {
    res.render("checkers", {
        title: "Checkers - Draughts - Damme"
    });
})

module.exports = router;