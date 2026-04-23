const express = require("express")
const router = express.Router();

router.get("/tictactoe", (req, res) => {
    res.render("tictactoe");
})

router.get("/checkers", (req, res) => {
    res.render("checkers");
})

module.exports = router;