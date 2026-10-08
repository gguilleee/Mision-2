# Declaración de uso de inteligencia artificial

**Herramienta:** Claude (Anthropic), usado a través de Claude Code en VS Code.

## Para qué se ha usado

- Proponer la estructura del proyecto (separación en `api/`, `lib/`, `ui/`) a partir del
  enunciado de la Misión 2 y de los apuntes de las Unidades 1 y 2.
- Generar el código inicial de los módulos, los estilos, este README y la división del
  trabajo en commits por fases.
- Escribir un script de prueba (fuera del repositorio) para comprobar los módulos contra la
  PokeAPI real: carga en paralelo, caché, error 404 y datos vacíos o malformados.

## Qué he hecho yo

- Elegir la asignatura, el enunciado y los apuntes como referencia, y revisar que el código
  usa lo visto en clase (async/await, `response.ok`, métodos de array inmutables, módulos ES,
  closures, `localStorage`).
- Pedir que el trabajo se dividiera en fases con un commit por cada una, crear el repositorio
  público en GitHub y vincularlo al proyecto.
- Instalar Node.js, ejecutar la aplicación con `npm run dev` y probarla en el navegador:
  selección de tipos, búsqueda, ordenación, "Cargar más", estado de error simulando la red
  desconectada desde DevTools y funcionamiento de la caché en *Application → Local Storage*.
- Repasar el código para entenderlo y poder defenderlo: capa HTTP (`response.ok`, timeout y
  caché), el control de respuestas tardías en `main.js` y las transformaciones con `reduce` y
  `Object.groupBy`.

## Compromiso

Entiendo el código entregado y puedo explicar cualquier parte en la defensa.
