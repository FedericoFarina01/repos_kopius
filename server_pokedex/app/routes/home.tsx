import { Form, redirect } from "react-router";
import * as v from "valibot";
import type { Route } from "./+types/home";

// Validación del pokemon
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

const RawPokemonSchema = v.object({
  name: v.string(),
  url: v.string(),
});

const CapturedQueryParamSchema = v.pipe(
  v.string(),
  v.transform((value) => {
    return value.split(",").map(Number);
  }),
);

const INTENT = {
  SET_FILTERS: "Set_filters",
  CAPTURE: "capture",
  RELEASE: "release",
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const url = new URL(request.url);

  switch (intent) {
    case INTENT.SET_FILTERS: {
      const name = formData.get("name");
      const type = formData.get("type");

      if (name) {
        const validatedName = v.parse(v.string(), name);
        url.searchParams.set("name", validatedName);
      } else {
        url.searchParams.delete("name");
      }

      if (type) {
        const validatedType = v.parse(v.string(), type);
        url.searchParams.set("type", validatedType);
      } else {
        url.searchParams.delete("type");
      }

      return redirect(url.toString());
    }

    case INTENT.CAPTURE: {
      // NOTE: no default values for "searchParams.get", ever.
      // use "null" to determine absence of value first.
      // this way, there is a clearer intent and the code can be followed easier
      const capturedParam = url.searchParams.get("captured");
      const capturedPokemonIds = capturedParam
        ? v.parse(CapturedQueryParamSchema, capturedParam)
        : [];
      // TODO: strictly type the return type of "formData.get" before using it
      const id = Number(formData.get("id"));

      // NOTE: we early return if the "id" is already captured.
      // clearer intent and we avoid an unnecesary redirection
      if (capturedPokemonIds.includes(id)) {
        return null;
      }

      const updatedCaptured = [...capturedPokemonIds, id];

      // TODO: you don't serialize the array yourself. Use "JSON.stringify" instead.
      // Rely on already existent best pratices
      url.searchParams.set("captured", updatedCaptured.join(","));
      return redirect(url.toString());
    }

    case INTENT.RELEASE: {
      const capturedParam = url.searchParams.get("captured") ?? "";
      const capturedPokemonIds = v.parse(
        CapturedQueryParamSchema,
        capturedParam,
      );
      const id = Number(formData.get("id"));

      const updatedCaptured = capturedPokemonIds.filter((capturedId) => {
        return capturedId !== id;
      });

      // TODO: you don't serialize the array yourself. Use "JSON.stringify" instead.
      // Rely on already existent best pratices
      url.searchParams.set("captured", updatedCaptured.join(","));
      return redirect(url.toString());
    }

    default:
      return redirect(request.url);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const capturedParam = url.searchParams.get("captured") ?? "";
  const capturedPokemonIds = v.parse(CapturedQueryParamSchema, capturedParam);

  const response = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=10&offset=0",
  );
  const data: { results: unknown } = await response.json();
  const rawPokemons = v.parse(v.array(RawPokemonSchema), data.results);

  const pokemons = await Promise.all(
    rawPokemons.map(async (rawPokemon) => {
      const response = await fetch(rawPokemon.url);
      const raw = await response.json();
      const pokemon = v.parse(PokemonSchema, raw);
      return pokemon;
    }),
  );

  return {
    pokemons,
    capturedPokemonIds,
  };
}

export default function Pokedex({ loaderData }: Route.ComponentProps) {
  const { pokemons, capturedPokemonIds } = loaderData;

  const uncaughtPokemons = pokemons.filter((pokemon) => {
    return !capturedPokemonIds.includes(pokemon.id);
  });

  const capturedPokemons = pokemons.filter((pokemon) => {
    return capturedPokemonIds.includes(pokemon.id);
  });

  const pokemonsCount = uncaughtPokemons.length;

  const capturedCount = capturedPokemons.length;

  return (
    <main>
      <h1>Pokedex</h1>

      {pokemonsCount > 0 ? (
        <>
          <section>
            <h2>Pokemons ({pokemonsCount})</h2>
            <div className="pokemon-list">
              {uncaughtPokemons.map((pokemon) => (
                <div key={pokemon.id} className="card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <h3>{pokemon.name.toUpperCase()}</h3>
                  <p>
                    Type:{" "}
                    {pokemon.types.map((type) => type.type.name).join(", ")}
                  </p>

                  <Form method="POST">
                    <input type="hidden" name="intent" value="capture" />
                    <input type="hidden" name="id" value={pokemon.id} />
                    <button type="submit">+</button>
                  </Form>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Captured Pokemons ({capturedCount})</h2>
            <div className="capturedPokemons-list">
              {capturedPokemons.map((pokemon) => (
                <div key={pokemon.id} className="card">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <h3>{pokemon.name.toUpperCase()}</h3>
                  <p>
                    Type:{" "}
                    {pokemon.types.map((type) => type.type.name).join(", ")}
                  </p>

                  <Form method="POST">
                    <input type="hidden" name="intent" value="release" />
                    <input type="hidden" name="id" value={pokemon.id} />
                    <button type="submit">-</button>
                  </Form>
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
