// Capa HTTP genérica: la única parte de la app que llama a fetch.

const TIEMPO_MAXIMO_MS = 8000;

export class ErrorHttp extends Error {
  constructor(status, url) {
    super(status === 404 ? 'El recurso no existe en la API (404)' : `La API respondió con un error (HTTP ${status})`);
    this.name = 'ErrorHttp';
    this.status = status;
    this.url = url;
  }
}

/**
 * Pide una URL y devuelve su JSON ya adaptado.
 * - fetch NO rechaza con 404/500, por eso se comprueba respuesta.ok.
 * - AbortSignal.timeout evita esperar para siempre a una API colgada.
 * - `adaptar` recorta la respuesta a lo que la app necesita.
 */
export async function pedirJson(url, { adaptar = (datos) => datos } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS) });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('La API tarda demasiado en responder. Inténtalo de nuevo.');
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

  return adaptar(json);
}
