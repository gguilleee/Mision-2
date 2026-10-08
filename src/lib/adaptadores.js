// Funciones puras que convierten las respuestas crudas de la PokeAPI
// en objetos pequeños y predecibles. Toleran campos ausentes o raros.

// Tipos que existen en la API pero no tienen Pokémon jugables.
const TIPOS_EXCLUIDOS = new Set(['unknown', 'shadow', 'stellar']);

// Los ids por encima de este número son formas alternativas (megas, regionales…).
export const ULTIMO_ID_NACIONAL = 1025;

/** "https://pokeapi.co/api/v2/pokemon/25/" → 25 (NaN si no se puede leer). */
export const idDesdeUrl = (url) => Number(String(url ?? '').split('/').filter(Boolean).at(-1));

export function adaptarListaTipos(json) {
  return (json?.results ?? [])
    .map((tipo) => tipo?.name)
    .filter((nombre) => typeof nombre === 'string' && !TIPOS_EXCLUIDOS.has(nombre));
}

const nombresDe = (lista) => (lista ?? []).map((item) => item?.name).filter(Boolean);

export function adaptarTipo(json) {
  const relaciones = json?.damage_relations ?? {};

  const pokemon = (json?.pokemon ?? [])
    .map(({ pokemon: p } = {}) => ({ nombre: p?.name, id: idDesdeUrl(p?.url) }))
    .filter((p) => p.nombre && Number.isInteger(p.id) && p.id <= ULTIMO_ID_NACIONAL)
    .toSorted((a, b) => a.id - b.id);

  return {
    nombre: json?.name ?? 'desconocido',
    pokemon,
    fuerteContra: nombresDe(relaciones.double_damage_to),
    debilContra: nombresDe(relaciones.double_damage_from),
    inmuneA: nombresDe(relaciones.no_damage_from),
  };
}

// Nombres de estadística de la API → claves de la app.
const CLAVES_STATS = {
  hp: 'ps',
  attack: 'ataque',
  defense: 'defensa',
  'special-attack': 'ataqueEsp',
  'special-defense': 'defensaEsp',
  speed: 'velocidad',
};

export function adaptarPokemon(json) {
  if (!json || !Number.isInteger(json.id)) return null; // dato inservible

  const stats = Object.fromEntries(
    Object.values(CLAVES_STATS).map((clave) => [clave, 0]),
  );
  for (const { stat, base_stat: valor } of json.stats ?? []) {
    const clave = CLAVES_STATS[stat?.name];
    if (clave) stats[clave] = Number(valor) || 0;
  }

  return {
    id: json.id,
    nombre: json.name ?? `pokémon ${json.id}`,
    imagen:
      json.sprites?.other?.['official-artwork']?.front_default ??
      json.sprites?.front_default ??
      null,
    tipos: (json.types ?? [])
      .toSorted((a, b) => (a?.slot ?? 0) - (b?.slot ?? 0))
      .map((t) => t?.type?.name)
      .filter(Boolean),
    stats,
    total: Object.values(stats).reduce((suma, valor) => suma + valor, 0),
    alturaM: (Number(json.height) || 0) / 10,
    pesoKg: (Number(json.weight) || 0) / 10,
  };
}
