const express = require("express");
const app = express();

app.use(express.static("static"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home");
}); 

const gamesRouter = require("./routes/games");
app.use("/games", gamesRouter);

app.listen(3000);