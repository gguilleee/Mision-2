// Caché en localStorage (BONUS). Guarda respuestas YA ADAPTADAS (pequeñas)
// con fecha de guardado, para no repetir peticiones durante un día.
// Todo acceso va en try/catch: localStorage puede estar lleno, bloqueado
// (modo privado) o contener JSON corrupto, y nada de eso debe romper la app.

const PREFIJO = 'async-odyssey:v1:';
const CADUCIDAD_MS = 24 * 60 * 60 * 1000;

function clavesPropias() {
  try {
    return Object.keys(localStorage).filter((clave) => clave.startsWith(PREFIJO));
  } catch {
    return [];
  }
}

export function leerCache(clave) {
  try {
    const bruto = localStorage.getItem(PREFIJO + clave);
    if (bruto === null) return null;

    const { guardado, datos } = JSON.parse(bruto);
    const caducado = typeof guardado !== 'number' || Date.now() - guardado > CADUCIDAD_MS;
    if (caducado || datos === undefined) {
      localStorage.removeItem(PREFIJO + clave);
      return null;
    }
    return datos;
  } catch {
    return null; // JSON corrupto o almacenamiento inaccesible: como si no hubiera caché
  }
}

/** Si la cuota está llena, borra la mitad más antigua de nuestras entradas. */
function liberarEspacio() {
  const fechaDe = (clave) => {
    try {
      return JSON.parse(localStorage.getItem(clave))?.guardado ?? 0;
    } catch {
      return 0;
    }
  };
  const masAntiguasPrimero = clavesPropias()
    .map((clave) => ({ clave, guardado: fechaDe(clave) }))
    .toSorted((a, b) => a.guardado - b.guardado);

  masAntiguasPrimero
    .slice(0, Math.ceil(masAntiguasPrimero.length / 2))
    .forEach(({ clave }) => localStorage.removeItem(clave));
}

export function guardarCache(clave, datos) {
  const entrada = JSON.stringify({ guardado: Date.now(), datos });
  try {
    localStorage.setItem(PREFIJO + clave, entrada);
  } catch {
    try {
      liberarEspacio();
      localStorage.setItem(PREFIJO + clave, entrada);
    } catch {
      // Sin espacio o sin permiso: la app sigue funcionando, solo que sin caché.
    }
  }
}

/** Borra solo las entradas de esta app y devuelve cuántas había. */
export function vaciarCache() {
  const claves = clavesPropias();
  claves.forEach((clave) => {
    try {
      localStorage.removeItem(clave);
    } catch {
      // ignorado a propósito
    }
  });
  return claves.length;
}
