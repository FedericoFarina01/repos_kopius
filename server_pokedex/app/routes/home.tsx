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
type Pokemon = v.InferOutput<typeof PokemonSchema>;

const RawPokemonSchema = v.object({
	name: v.string(),
	url: v.string(),
});

const INTENT = {
	SET_FILTERS: "Set_filters",
	CAPTURE: "capture",
	RELEASE: "release",
};

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const intent = formData.get("intent");
	const url = new URL(request.url);

	// TODO: replace multiple if with `switch` stemement
	if (intent === INTENT.SET_FILTERS) {
		const name = formData.get("name");
		const type = formData.get("type");

		if (name) {
		        // TODO: validate the "name" here using valibot
			// after that, you'll be able to use it in the
			// "searchParams.set" as a value without having an error
			url.searchParams.set("name", name);
		} else {
			url.searchParams.delete("name");
		}

		if (type) {
		        // TODO: validate the "type" here using valibot
			url.searchParams.set("type", type);
		} else {
			url.searchParams.delete("type");
		}

		return redirect(url.toString());
	}

	// TODO: to me, "captured" is a adjective. I'm missing the noun here.
	// "catpuredWHAT"?
	// NOTE: what happens if captured is not of the expected shape "captured=1,5,3"
	//       and instead it's ANY other thing. "captured=b8224bvsjsjLLLLL"
	//       that's why it's important to validate your incoming data
	//       in this case "url.searchParams.get("captured")" should be validated before used
	const capturedIds =
		url.searchParams.get("captured")?.split(",").map(Number) ?? [];

	if (intent === INTENT.CAPTURE) {
		const id = Number(formData.get("id"));

		const updatedCaptured = capturedIds.includes(id)
			? capturedIds
			: [...capturedIds, id];

		url.searchParams.set("captured", updatedCaptured.join(","));
		return redirect(url.toString());
	}

	if (intent === INTENT.RELEASE) {
		const id = Number(formData.get("id"));

		// TODO: don't use name contractions
		const updatedCaptured = capturedIds.filter((c) => c !== id);

		url.searchParams.set("captured", updatedCaptured.join(","));
		return redirect(url.toString());
	}

	return redirect(request.url);
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const capturedIds =
		url.searchParams.get("captured")?.split(",").map(Number) ?? [];

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
		capturedIds,
	};
}

export default function Pokedex({ loaderData }: Route.ComponentProps) {
	const { pokemons, capturedIds } = loaderData;

	const uncaughtPokemons = pokemons.filter(
		(pokemon) => !capturedIds.includes(pokemon.id),
	);

	const capturedPokemons = pokemons.filter((pokemon) =>
		capturedIds.includes(pokemon.id),
	);

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
