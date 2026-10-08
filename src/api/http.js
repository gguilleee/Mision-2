// Capa HTTP genérica: la única parte de la app que llama a fetch.
import { leerCache, guardarCache } from '../lib/cache.js';

const TIEMPO_MAXIMO_MS = 8000;

// Cuántas respuestas han salido de la red y cuántas de la caché desde la última lectura.
const metricas = { red: 0, cache: 0 };

/** Devuelve las métricas acumuladas y las pone a cero. */
export function tomarMetricas() {
  const copia = { ...metricas };
  metricas.red = 0;
  metricas.cache = 0;
  return copia;
}

export class ErrorHttp extends Error {
  constructor(status, url) {
    super(status === 404 ? 'El recurso no existe en la API (404).' : `La API respondió con un error (HTTP ${status}).`);
    this.name = 'ErrorHttp';
    this.status = status;
    this.url = url;
  }
}

/**
 * Pide una URL y devuelve su JSON ya adaptado.
 * - Primero mira la caché de localStorage (bonus).
 * - fetch NO rechaza con 404/500, por eso se comprueba respuesta.ok.
 * - AbortSignal.timeout evita esperar para siempre a una API colgada.
 * - `adaptar` recorta la respuesta a lo que la app necesita: así lo que se
 *   guarda en caché ocupa poco.
 */
export async function pedirJson(url, { adaptar = (datos) => datos, cachear = true } = {}) {
  if (cachear) {
    const guardado = leerCache(url);
    if (guardado !== null) {
      metricas.cache++;
      return guardado;
    }
  }

  let respuesta;
  try {
    respuesta = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS) });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('La API tarda demasiado en responder. Inténtalo de nuevo.');
    }
    if (navigator.onLine === false) {
      throw new Error('Parece que no tienes conexión a internet.');
    }
    throw new Error('No se pudo conectar con la API. Revisa tu conexión.');
  }

  if (!respuesta.ok) throw new ErrorHttp(respuesta.status, url);

  let json;
  try {
    json = await respuesta.json();
  } catch {
    throw new Error('La API devolvió una respuesta que no es JSON válido.');
  }

  metricas.red++;
  const datos = adaptar(json);
  if (cachear && datos !== null && datos !== undefined) guardarCache(url, datos);
  return datos;
}
