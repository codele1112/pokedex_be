const fs = require("fs");
var express = require("express");
var router = express.Router();
var path = require("path");
const { resolve } = require("path");
let rootDir = path.resolve(__dirname);

//Read data from db.json then parse to JSobject
const absolutePath = resolve("./pokemon.json");
let db = fs.readFileSync(absolutePath, "utf-8");
db = JSON.parse(db);
// let { data } = db;

/* GET all data, filter by name, types */

router.get("/", (req, res, next) => {
  const { body, params, url, query } = req;
  console.log({ body, params, url, query });

  const allowedFilter = ["name", "type", "id", "search"];
  try {
    let { page, limit, ...filterQuery } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    //allow name,limit and page query string only
    const filterKeys = Object.keys(filterQuery);

    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    // //processing logic
    //Number of items skip for selection
    let offset = limit * (page - 1);

    if (filterKeys.length) {
      if (filterQuery.type) {
        const searchQuery = filterQuery.type.toLowerCase();

        db.pokemons = db.pokemons.filter((pokemon) => {
          return pokemon.types.includes(searchQuery);
        });
      }
      if (filterQuery.search) {
        let searchQuery = filterQuery.search.toLowerCase();
        db.pokemons = db.pokemons.filter((pokemon) => {
          return pokemon.name.includes(searchQuery);
        });
      }
    }

    data = {
      count: db.pokemons.length,
      pokemons: db.pokemons.slice(offset, offset + limit),
      totalPokemons: db.pokemons.length,
    };

    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
});

// [GET] single Pokémon information together with the previous and next pokemon information.
router.get("/:id", (req, res, next) => {
  let result = [];
  try {
    const pokemonId = req.params.id;

    const targetIndex = db.pokemons.findIndex(
      (pokemon) => pokemonId === pokemon.id
    );

    console.log("targetId", targetIndex);
    console.log("pokemonId", pokemonId);

    if (targetIndex < 0) {
      const error = new Error("Pokemon not found");
      error.statusCode = 400;
      throw error;
    }

    const lastIndex = db.pokemons.length - 1;
    let prevIndex = targetIndex - 1;
    let nextIndex = targetIndex + 1;

    if (targetIndex === lastIndex) {
      nextIndex = 0;
    }
    if (targetIndex === 0) {
      prevIndex = lastIndex;
    }
    let data = db.pokemons;
    const pokemon = data[targetIndex];
    const prevPokemon = data[prevIndex];
    const nextPokemon = data[nextIndex];

    let result = {
      prevPokemon,
      pokemon,
      nextPokemon,
    };
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

// [POST] creating new Pokémon
router.post("/", function (req, res, next) {
  try {
    const { name, types, id, url } = req.body;

    if (!name || !types) {
      const error = new Error("Missing body info");
      error.statusCode = 400;
      throw error;
    }
    if (types.length > 2) {
      const error = new Error("Pokémon can only have one or two types.");
      error.statusCode = 400;
      throw error;
    }

    const allTypes = [];
    db.pokemons.forEach((pokemon) => allTypes.push(...pokemon.types));
    if (!types.every((element) => allTypes.includes(element))) {
      const error = new Error("Pokémon's type is invalid.");
      error.statusCode = 400;
      throw error;
    }
    db.pokemons.forEach((pokemon) => {
      if (name === pokemon.name || id === pokemon.id) {
        const error = new Error("The Pokémon already exists.");
        error.statusCode = 400;
        throw error;
      }
    });
    const newPokemon = {
      name,
      types,
      id: (id || db.length + 1).toString(),
      url: url,
    };

    db.pokemons.push(newPokemon);

    fs.writeFileSync(absolutePath, JSON.stringify(db.pokemons));

    res.status(200).send(newPokemon);
  } catch (error) {
    res.status(200).send({ ...error, rootDir });
  }
});

//  [PUT]  updating a Pokémon
router.put("/:id", function (req, res, next) {
  try {
    const allowUpdate = ["name", "types"];

    const pokemonId = req.params.id;
    const updates = req.body;
    const updateKeys = Object.keys(updates);

    //find update request that not allow
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    console.log("updates fields ", updates);

    if (notAllow.length) {
      const error = new Error(`Update field not allow`);
      error.statusCode = 400;
      throw error;
    }

    //put processing
    //find pokemon by id
    let data = db.pokemons;

    const targetIndex = data.findIndex((pokemon) => pokemon.id === pokemonId);

    console.log("targetIndex", targetIndex);

    if (targetIndex < 0) {
      const error = new Error(`Pokemon not found`);
      error.statusCode = 404;
      throw error;
    }

    //Update new content to db JS object
    const updatedPokemon = { ...db.pokemons[targetIndex], ...updates };

    console.log("updatedPokemon", updatedPokemon);
    //write and save to pokemon.json
    fs.writeFileSync(absolutePath, JSON.stringify(db));

    //put send response
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

// [DELETE] deleting a Pokémon by Id
router.delete("/:id", function (req, res, next) {
  try {
    const pokemonId = req.params.id;

    const targetIndex = db.pokemons.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );

    if (targetIndex < 0) {
      const error = new Error("Pokemon not found");
      error.statusCode = 400;
      throw error;
    }
    console.log(pokemonId);
    console.log(targetIndex);

    db.pokemons = db.pokemons.filter((pokemon) => pokemon.id !== pokemonId);

    fs.writeFileSync(absolutePath, JSON.stringify(db));

    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
