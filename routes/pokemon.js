const fs = require("fs");
var express = require("express");
var router = express.Router();
const { type } = require("os");
var path = require("path");
const { resolve } = require("path");
let rootDir = path.resolve(__dirname);

//Read data from db.json then parse to JSobject
const absolutePath = resolve("./pokemon.json");
let db = fs.readFileSync(absolutePath, "utf-8");
db = JSON.parse(db);
const { data } = db;
/* GET all data, filter by name, types */

router.get("/", (req, res, next) => {
  // res.send(pokemons);
  const { body, params, url, query } = req;
  console.log({ body, params, url, query });

  const allowedFilter = ["name", "types", "id", "search"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    console.log("filterQuery:", filterQuery);

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 50;
    //allow name,limit and page query string only
    const filterKeys = Object.keys(filterQuery);
    // console.log("filterKeys:", filterKeys);

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

    let result = [];
    if (filterKeys.length) {
      if (filterQuery.types) {
        const searchQuery = filterQuery.types.toLowerCase();
        // console.log("searchQuery:", searchQuery);

        result = data.filter((pokemon) => pokemon.types.includes(searchQuery));
      }
      if (filterQuery.search) {
        let searchQuery = filterQuery.search.toLowerCase();
        // console.log("searchQuery type", typeof searchQuery);
        result = data.filter((pokemon) => {
          return pokemon.name.includes(searchQuery);
        });
      }
    } else {
      result = data;
    }
    // then select number of result by offset
    result = result.slice(offset, offset + limit);
    //send response
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

// [GET] single Pokémon information together with the previous and next pokemon information.
router.get("/:id", (req, res, next) => {
  try {
    const pokemonId = req.params.id;
    // console.log("pokemonId", pokemonId);
    const targetIndex = data.findIndex((pokemon) => pokemonId === pokemon.id);

    console.log("targetId", targetIndex);

    if (targetIndex < 0) {
      const error = new Error("Pokemon not found");
      error.statusCode = 400;
      throw error;
    }

    const lastIndex = data.length - 1;
    let prevIndex = targetIndex - 1;
    let nextIndex = targetIndex + 1;

    if (targetIndex === lastIndex) {
      nextIndex = 0;
    }
    if (targetIndex === 0) {
      prevIndex = lastIndex;
    }

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
router.post(`/`, function (req, res, next) {
  try {
    const { name, types, id, url } = req.body;
    console.log({ name, types, id, url });

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
    data.forEach((pokemon) => allTypes.push(...pokemon.types));
    console.log(allTypes);
    console.log("types", types);
    if (!types.every((element) => allTypes.includes(element))) {
      const error = new Error("Pokémon's type is invalid.");
      error.statusCode = 400;
      throw error;
    }
    data.forEach((pokemon) => {
      if (name === pokemon.name || id === pokemon.id) {
        const error = new Error("The Pokémon already exists.");
        error.statusCode = 400;
        throw error;
      }
    });
    const newPokemon = {
      name,
      types,
      id: id || (data.length + 1).toString(),
      url: url,
    };

    db.data.push(newPokemon);

    fs.writeFileSync(absolutePath, JSON.stringify(db));

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

    if (notAllow.length) {
      const error = new Error(`Update field not allow`);
      error.statusCode = 400;
      throw error;
    }

    //put processing
    //find pokemon by id
    const targetIndex = data.findIndex((pokemon) => pokemon.id === pokemonId);

    if (targetIndex < 0) {
      const error = new Error(`Pokemon not found`);
      error.statusCode = 404;
      throw error;
    }

    //Update new content to db JS object
    const updatedPokemon = { ...db.data[targetIndex], ...updates };

    //write and save to pokemon.json
    fs.writeFileSync("pokemon.json", JSON.stringify(db));

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

    const targetIndex = db.data.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );

    if (targetIndex < 0) {
      const error = new Error("Pokemon not found");
      error.statusCode = 400;
      throw error;
    }
    console.log(pokemonId);
    console.log(targetIndex);

    db.data = db.data.filter((pokemon) => pokemon.id !== pokemonId);

    fs.writeFileSync("pokemon.json", JSON.stringify(db));

    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
