// Datos fijos de presentación: nombre en español y color de cada tipo.
// `claro` indica que el color de fondo necesita texto oscuro para leerse bien.
export const TIPOS = {
  normal: { es: 'Normal', color: '#a8a77a', claro: true },
  fire: { es: 'Fuego', color: '#e4572e' },
  water: { es: 'Agua', color: '#3b7dd8' },
  grass: { es: 'Planta', color: '#3f9a4b' },
  electric: { es: 'Eléctrico', color: '#f2c12e', claro: true },
  ice: { es: 'Hielo', color: '#7fd3e0', claro: true },
  fighting: { es: 'Lucha', color: '#b8322a' },
  poison: { es: 'Veneno', color: '#8e44ad' },
  ground: { es: 'Tierra', color: '#c49a55', claro: true },
  flying: { es: 'Volador', color: '#8fa6e8', claro: true },
  psychic: { es: 'Psíquico', color: '#e0507f' },
  bug: { es: 'Bicho', color: '#8a9a1b' },
  rock: { es: 'Roca', color: '#9c8a45' },
  ghost: { es: 'Fantasma', color: '#62508f' },
  dragon: { es: 'Dragón', color: '#5145d6' },
  dark: { es: 'Siniestro', color: '#4a3f3a' },
  steel: { es: 'Acero', color: '#7b97a8' },
  fairy: { es: 'Hada', color: '#e48fcf', claro: true },
};

export const infoTipo = (nombre) => TIPOS[nombre] ?? { es: String(nombre), color: '#777777' };

export const ETIQUETAS_STATS = {
  ps: 'PS',
  ataque: 'Ataque',
  defensa: 'Defensa',
  ataqueEsp: 'At. Esp.',
  defensaEsp: 'Def. Esp.',
  velocidad: 'Velocidad',
};
