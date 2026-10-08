// Lógica de la vista: transformaciones puras sobre los Pokémon ya adaptados.
// Ninguna función muta su entrada (toSorted en lugar de sort).

const COMPARADORES = {
  id: (a, b) => a.id - b.id,
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  total: (a, b) => b.total - a.total,
  velocidad: (a, b) => b.stats.velocidad - a.stats.velocidad,
  peso: (a, b) => b.pesoKg - a.pesoKg,
};

export const ordenar = (lista, criterio) =>
  lista.toSorted(COMPARADORES[criterio] ?? COMPARADORES.id);

/** Minúsculas y sin tildes, para que "pikachú" encuentre "pikachu". */
export const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/** Filtra referencias {nombre, id} por nombre o por número exacto ("25" o "#25"). */
export function filtrarPorNombre(referencias, busqueda) {
  const consulta = normalizar(busqueda).replace(/^#0*/, '');
  if (!consulta) return referencias;
  return referencias.filter(
    (ref) => normalizar(ref.nombre).includes(consulta) || String(ref.id) === consulta,
  );
}

/** Un único reduce calcula todas las cifras del resumen. */
export function resumir(lista) {
  if (lista.length === 0) return null;
  const [primero] = lista;

  const { sumaTotal, ...destacados } = lista.reduce(
    (acc, p) => ({
      sumaTotal: acc.sumaTotal + p.total,
      masFuerte: p.total > acc.masFuerte.total ? p : acc.masFuerte,
      masRapido: p.stats.velocidad > acc.masRapido.stats.velocidad ? p : acc.masRapido,
      masPesado: p.pesoKg > acc.masPesado.pesoKg ? p : acc.masPesado,
    }),
    { sumaTotal: 0, masFuerte: primero, masRapido: primero, masPesado: primero },
  );

  return { cantidad: lista.length, mediaTotal: Math.round(sumaTotal / lista.length), ...destacados };
}

/** ¿Con qué otros tipos se combina el tipo explorado? Agrupa con Object.groupBy. */
export function companerosDeTipo(lista, tipoActual) {
  const grupos = Object.groupBy(lista, (p) => p.tipos.find((t) => t !== tipoActual) ?? 'puro');
  return Object.entries(grupos)
    .map(([tipo, miembros]) => ({ tipo, cantidad: miembros.length }))
    .toSorted((a, b) => b.cantidad - a.cantidad);
}
