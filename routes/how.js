const express = require("express")
const router = express.Router();

router.get("/general", (req, res) => {
    res.render("how2play", {title: "How"});
})

router.get("/checkers", (req, res) => {
    res.render("howcheckers", {title: "How to checkers"});
})

router.get("/tictactoe", (req, res) => {
    res.render("howtictactoe", {title: "How to tictactoe"});
})

module.exports = router;