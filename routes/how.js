const express = require("express")
const router = express.Router();

router.get("/general", (req, res) => {
    res.render("how2play", {title: "How", howroute: "general"});
})

router.get("/checkers", (req, res) => {
    res.render("howcheckers", {title: "How to checkers", howroute: "checkers"});
})

router.get("/tictactoe", (req, res) => {
    res.render("howtictactoe", {title: "How to tictactoe", howroute: "tictactoe"});
})

router.get("/spar", (req, res) => {
    res.render("howspar", {title: "How to spar", howroute: "spar"})
})

module.exports = router;