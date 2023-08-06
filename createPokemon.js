const fs = require("fs");
const csv = require("csvtojson");

const BaseUrl = "https://pokedex-be-i1yb.onrender.com";
const createPokemon = async () => {
  const img = fs.readdirSync("./public/images");

  let newData = await csv().fromFile("pokemon.csv");

  newData = newData.filter((e) => {
    const imgName = e.Name + ".png";
    return img.includes(imgName);
  });
  console.log("baseURl", BaseUrl);
  newData = new Set(newData.map((e) => e));
  newData = Array.from(newData);

  newData = newData
    .map((e, index) => {
      return {
        id: (index + 1).toString(),
        name: e.Name,
        types: [e.Type1, e.Type2]
          .filter(Boolean)
          .map((type) => type.toLowerCase()),
        url: `${BaseUrl}/images/${e.Name}.png`,
      };
    })
    .filter((e) => e.name);

  let data = JSON.parse(fs.readFileSync("pokemon.json"));
  data.count = newData.length;
  data.pokemons = newData;
  data.totalPokemons = newData.length;

  fs.writeFileSync("pokemon.json", JSON.stringify(data));
  // console.log(data);

  console.log("done");
};

createPokemon();
