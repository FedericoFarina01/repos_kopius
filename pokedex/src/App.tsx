import { useEffect, useState } from "react";
import * as v from "valibot";
import "./App.css";

const TypeSchema = v.object({
  type: v.object({
    name: v.string(),
  }),
});
const PokemonSchema = v.object({
  id: v.number(),
  name: v.string(),
  sprites: v.object({
    front_default: v.string(),
  }),
  types: v.array(TypeSchema),
});
type Pokemon = v.InferOutput<typeof PokemonSchema>;
const RawPokemonSchema = v.object({
  name: v.string(),
  url: v.string(),
});

function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [capturedPokemons, setCapturedPokemons] = useState<Pokemon[]>(() => {
    const saved = localStorage.getItem("capturedPokemons");
    if (!saved) {
      return [];
    }
    const capturedPokemons = v.parse(v.array(PokemonSchema), JSON.parse(saved));
    return capturedPokemons;
  });
  const [nameSearch, setNameSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");

  const types = pokemons.reduce<Array<string>>((acc, pokemon) => {
    for (const type of pokemon.types) {
      const name = type.type.name;
      if (!acc.includes(name)) {
        acc.push(name);
      }
    }
    return acc;
  }, []);
  console.log("types", types);

  useEffect(() => {
    localStorage.setItem("capturedPokemons", JSON.stringify(capturedPokemons));
  }, [capturedPokemons]);

  const showingPokemons = pokemons
    .filter((pokemon) => {
      if (!nameSearch) {
        return true;
      }
      return pokemon.name.toLowerCase().includes(nameSearch.toLowerCase());
    })
    .filter((pokemon) => {
      if (!typeSearch) {
        return true;
      }
      const type = pokemon.types.find((type) => type.type.name === typeSearch);
      if (type) {
        return true;
      }
      return false;
    });

  const pokemonsCount = showingPokemons.length;
  const capturedCount = capturedPokemons.length;

  useEffect(() => {
    async function run() {
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=10&offset=0",
      );
      const data = await response.json();
      const rawPokemons = v.parse(v.array(RawPokemonSchema), data.results);
      const pokemons = await Promise.all(
        rawPokemons.map(async (rawPokemon) => {
          const response = await fetch(rawPokemon.url);
          const data = await response.json();
          const pokemon = v.parse(PokemonSchema, data);
          return pokemon;
        }),
      );
      setPokemons(pokemons);
    }
    run();
  }, []);

  return (
    <main>
      <h1>Pokedex</h1>
      <div>
        <label>
          Search pokemon:{" "}
          <input
            name="filtro-nombre"
            value={nameSearch}
            onChange={(event) => {
              setNameSearch(event.target.value);
            }}
          />
        </label>
        <label>
          <select
            name="filtro-tipo"
            value={typeSearch}
            onChange={(event) => {
              setTypeSearch(event.target.value);
            }}
          >
            <option value="">All</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>
      {pokemonsCount > 0 ? (
        <>
          <section>
            <h2>Pokemons ({pokemonsCount})</h2>
            <div className="pokemon-list">
              {showingPokemons.map((pokemon) => (
                <div key={pokemon.id} className="card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <h3>{pokemon.name.toUpperCase()}</h3>
                  <p>
                    Type:{" "}
                    {pokemon.types.map((type) => type.type.name).join(", ")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const capturedPokemon = capturedPokemons.find(
                        (p) => p.id === pokemon.id,
                      );

                      if (!capturedPokemon) {
                        setCapturedPokemons([...capturedPokemons, pokemon]);
                        setPokemons(
                          pokemons.filter(
                            (pokemon) => pokemon.id !== pokemon.id,
                          ),
                        );
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>{" "}
          <section>
            <h2>Captured Pokemons ({capturedCount})</h2>
            <div className="capturedPokemons-list">
              {capturedPokemons.map((pokemon) => (
                <div key={pokemon.id} className="card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <h3>{pokemon.name.toUpperCase()}</h3>
                  <p>
                    Tipo:{" "}
                    {pokemon.types.map((type) => type.type.name).join(", ")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPokemons([...pokemons, pokemon]);

                      setCapturedPokemons(
                        capturedPokemons.filter(
                          (pokemon) => pokemon.id !== pokemon.id,
                        ),
                      );
                    }}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p>No pokemons available</p>
      )}
    </main>
  );
}

export default App;
