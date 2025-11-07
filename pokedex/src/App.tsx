import { useEffect, useState } from "react";
import * as v from "valibot";
import "./App.css";

const PokemonSchema = v.object({
  id: v.number(),
  name: v.string(),
  sprites: v.object({
    front_default: v.string(),
  }),
  types: v.array(
    v.object({
      type: v.object({
        name: v.string(),
      }),
    }),
  ),
});

type Pokemon = {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
};

function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [capturedPokemons, setCapturedPokemons] = useState<Pokemon[]>(() => {
    const saved = localStorage.getItem("capturedPokemons");
    const initialValue = saved ? JSON.parse(saved) : [];
    return initialValue;
  });

  const [nameSearch, setNameSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");

  const typesList: string[] = [];
  for (const pokemon of pokemons) {
    for (const t of pokemon.types) {
      const type = t.type.name;
      if (!typesList.includes(type)) {
        typesList.push(type);
      }
    }
  }

  useEffect(() => {
    localStorage.setItem("capturedPokemons", JSON.stringify(capturedPokemons));
  }, [capturedPokemons]);

  // Filter by name
  const pokemonsFilteredByName = nameSearch
    ? pokemons.filter((p) =>
        p.name.toLowerCase().includes(nameSearch.toLowerCase()),
      )
    : pokemons;

  // Filter by type
  const pokemonsFilteredByType = typeSearch
    ? pokemonsFilteredByName.filter((p) =>
        p.types.find((t) => t.type.name === typeSearch),
      )
    : pokemonsFilteredByName;

  const totalPokemons = pokemonsFilteredByType.length;
  const totalCaptured = capturedPokemons.length;

  useEffect(() => {
    async function run() {
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=10&offset=0",
      );
      const data = await response.json();

      const completedPokemons: Pokemon[] = [];
      for (const p of data.results) {
        const res = await fetch(p.url);
        const pokemonData = await res.json();
        const pokemon = v.parse(PokemonSchema, pokemonData);
        completedPokemons.push(pokemon);
      }

      setPokemons(completedPokemons);
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
            onChange={(e) => setNameSearch(e.target.value)}
          />
        </label>
        <label>
          <select
            name="filtro-tipo"
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
          >
            <option value="">All</option>
            {typesList.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>
      {totalPokemons > 0 ? (
        <>
          <section>
            <h2>Pokemons ({totalPokemons})</h2>

            <div className="pokemon-list">
              {pokemonsFilteredByType.map((pokemon) => (
                <div key={pokemon.id} className="card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <h3>{pokemon.name.toUpperCase()}</h3>
                  <p>
                    Type: {pokemon.types.map((t) => t.type.name).join(", ")}
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
                          pokemons.filter((p) => p.id !== pokemon.id),
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
            <h2>Captured Pokemons ({totalCaptured})</h2>
            <div className="capturedPokemons-list">
              {capturedPokemons.map((pokemon) => (
                <div key={pokemon.id} className="card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <h3>{pokemon.name.toUpperCase()}</h3>
                  <p>
                    Tipo: {pokemon.types.map((t) => t.type.name).join(", ")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPokemons([...pokemons, pokemon]);

                      setCapturedPokemons(
                        capturedPokemons.filter((p) => p.id !== pokemon.id),
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
