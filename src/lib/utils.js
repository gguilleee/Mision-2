/**
 * Retrasa la ejecución de `funcion` hasta que pasen `espera` ms sin nuevas llamadas.
 * El temporizador vive en un closure: cada función "debounced" tiene el suyo.
 */
export function debounce(funcion, espera = 300) {
  let temporizador;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...argumentos), espera);
  };
}
