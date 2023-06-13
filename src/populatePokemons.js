const mongoose = require("mongoose");
const https = require("https");
const ProgressBar = require("progress");

const getPokemonsData = async () => {
  return new Promise((resolve, reject) => {
    https.get("https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json", (res) => {
      let chunks = "";
      res.on("data", (chunk) => {
        chunks += chunk;
      });
      res.on("end", () => {
        resolve(JSON.parse(chunks));
      });
      res.on("error", (err) => {
        reject(err);
      });
    });
  });
};

const insertPokemon = async (pokeModel, element) => {
  element["base"]["Speed Attack"] = element["base"]["Sp. Attack"];
  delete element["base"]["Sp. Attack"];
  element["base"]["Speed Defense"] = element["base"]["Sp. Defense"];
  delete element["base"]["Sp. Defense"];

  return pokeModel.findOneAndUpdate(element, {}, { upsert: true, new: true });
};

const populatePokemons = async (pokeSchema) => {
  const pokeModel = mongoose.model("pokemons", pokeSchema);
  const pokemonsData = await getPokemonsData();

  const bar = new ProgressBar("## inserting :pokeName [:bar] :percent :etas ", {
    complete: "=",
    incomplete: " ",
    width: 20,
    total: pokemonsData.length,
  });

  for (const element of pokemonsData) {
    await insertPokemon(pokeModel, element);
    bar.tick({ pokeName: element.name.english });
  }

  return pokeModel;
};

module.exports = { populatePokemons };
