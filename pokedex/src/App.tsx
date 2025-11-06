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
	const [pokemonsCapturados, setCapturados] = useState<Pokemon[]>([]);
	const [nombreBusqueda, setNombreBusqueda] = useState("");
	const [tipoBusqueda, setTipoBusqueda] = useState("");

	const listaTipos: string[] = [];
	for (const pokemon of pokemons) {
		for (const t of pokemon.types) {
			const tipo = t.type.name;
			if (!listaTipos.includes(tipo)) {
				listaTipos.push(tipo);
			}
		}
	}

	// Filtrar por nombre
	const pokemonsFiltradosPorNombre = nombreBusqueda
		? pokemons.filter((p) =>
				p.name.toLowerCase().includes(nombreBusqueda.toLowerCase()),
			)
		: pokemons;

	// Filtrar por tipo
	const pokemonsFiltradosPorTipo = tipoBusqueda
		? pokemonsFiltradosPorNombre.filter((p) =>
				p.types.find((t) => t.type.name === tipoBusqueda),
			)
		: pokemonsFiltradosPorNombre;

	const totalPokemons = pokemonsFiltradosPorTipo.length;
	const totalCapturados = pokemonsCapturados.length;

	useEffect(() => {
		async function run() {
			const response = await fetch(
				"https://pokeapi.co/api/v2/pokemon?limit=10&offset=0",
			);
			const data = await response.json();

			const pokemonsCompletos: Pokemon[] = [];
			for (const p of data.results) {
				const res = await fetch(p.url);
				const pokemonData = await res.json();
				const pokemon = v.parse(PokemonSchema, pokemonData);
				pokemonsCompletos.push(pokemon);
			}

			setPokemons(pokemonsCompletos);
		}

		run();
	}, []);

	return (
		<main>
			<h1>Pokedex</h1>
			<div>
				<label>
					Buscar Pokemon:{" "}
					<input
						name="filtro-nombre"
						value={nombreBusqueda}
						onChange={(e) => setNombreBusqueda(e.target.value)}
					/>
				</label>
				<label>
					<select
						name="filtro-tipo"
						value={tipoBusqueda}
						onChange={(e) => setTipoBusqueda(e.target.value)}
					>
						<option value="">Todos</option>
						{listaTipos.map((tipo) => (
							<option key={tipo} value={tipo}>
								{tipo}
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
							{pokemonsFiltradosPorTipo.map((pokemon) => (
								<div key={pokemon.id} className="card">
									<img src={pokemon.sprites.front_default} alt={pokemon.name} />
									<h3>{pokemon.name.toUpperCase()}</h3>
									<p>
										Tipo: {pokemon.types.map((t) => t.type.name).join(", ")}
									</p>
									<button
										type="button"
										onClick={() => {
											const pokemonCapturado = pokemonsCapturados.find(
												(p) => p.id === pokemon.id,
											);

											if (!pokemonCapturado) {
												setCapturados([...pokemonsCapturados, pokemon]);
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
					</section>

					<section>
						<h2>Pokemons Capturados ({totalCapturados})</h2>
						<div className="pokemonCapturados-list">
							{pokemonsCapturados.map((pokemon) => (
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

											setCapturados(
												pokemonsCapturados.filter((p) => p.id !== pokemon.id),
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
				<p>No hay Pokemons disponibles</p>
			)}
		</main>
	);
}

export default App;
