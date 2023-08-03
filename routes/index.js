var express = require("express");
var router = express.Router();
/* GET pokemons page. */
var pokemonRouter = require("./pokemon.js");
router.use("/pokemons", pokemonRouter);

/* GET home page. */
router.use("/", function (req, res, next) {
  res.status(200).send("Welcome to CoderSchool!");
});
module.exports = router;
