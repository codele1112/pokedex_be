const fs = require("fs");
const { faker } = require("@faker-js/faker");

const createPokemons = (numberOfPokemons) => {
  if (!numberOfPokemons) {
    console.log("input the number");
    return;
  }
  numberOfPokemons = parseInt(numberOfPokemons);
  console.log("creating user");

  let data = JSON.parse(fs.readFileSync("pokemon.js"));
  for (let i = 0; i < numberOfPokemons; i++) {
    const pokemon = {
      name: faker.person.firstName(),
      types: faker.animal.type(),
    };
    console.log("created", pokemon.name, pokemon.types);
    console.log("-----");
    data.data.push(pokemon);
  }
  fs.writeFileSync("pokemon.js", JSON.stringify(data));
  console.log(`create ${numberOfPokemons} success. `);
};

const input = process.argv.slice(2)[0];
// console.log(input);
createPokemons(input);
