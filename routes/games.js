const express = require("express")
const router = express.Router();

router.get("/tictactoe", (req, res) => {
    res.render("tictactoe", {
        title: "TicTacToe",
        howroute: "tictactoe",
    });
})

router.get("/checkers", (req, res) => {
    res.render("checkers", {
        title: "Checkers - Draughts - Damme",
        howroute: "checkers"
    });
})

router.get("/spar", (req, res) => {
    res.render("spar", {
        title: "Spar - A Ghanaian Card Game",
        howroute: "spar"
    })
})

// router.get("/chess", (req, res) => {
//     res.render("chess", {
//         title: "Chess",
//     })
// })

module.exports = router;