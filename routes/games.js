const express = require("express")
const router = express.Router();

router.get("/tictactoe", (req, res) => {
    res.render("tictactoe", {
        title: "TicTacToe",
    });
})

router.get("/checkers", (req, res) => {
    res.render("checkers", {
        title: "Checkers - Draughts - Damme",
    });
})

// router.get("/chess", (req, res) => {
//     res.render("chess", {
//         title: "Chess",
//     })
// })

module.exports = router;