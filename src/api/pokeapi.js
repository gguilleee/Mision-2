// Endpoints concretos de la PokeAPI. Aquí no se toca el DOM.
import { pedirJson } from './http.js';
import { adaptarListaTipos, adaptarTipo, adaptarPokemon } from '../lib/adaptadores.js';

const BASE = 'https://pokeapi.co/api/v2';

export function obtenerTipos() {
  return pedirJson(`${BASE}/type?limit=50`, { adaptar: adaptarListaTipos });
}

export function obtenerTipo(nombre) {
  return pedirJson(`${BASE}/type/${encodeURIComponent(nombre)}`, { adaptar: adaptarTipo });
}

export function obtenerPokemon(id) {
  return pedirJson(`${BASE}/pokemon/${id}`, { adaptar: adaptarPokemon });
}

/**
 * Pide varios Pokémon EN PARALELO. Con allSettled, que uno falle no tumba
 * al resto: devolvemos los que llegaron y cuántos se perdieron por el camino.
 */
export async function obtenerVariosPokemon(ids) {
  const resultados = await Promise.allSettled(ids.map(obtenerPokemon));

  const pokemon = resultados
    .filter((r) => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);

  return { pokemon, perdidos: ids.length - pokemon.length };
}
