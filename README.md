# Async Odyssey · Bitácora de tipos

> «El event loop no espera a nadie.»

Misión 2 de **Web Development I, the Client** (U-tad, 2026–2027).

Aplicación web hecha con **Vite** y JavaScript moderno (módulos ES) que consume la
[PokeAPI](https://pokeapi.co) con `fetch` + `async/await`. La idea es un **cuaderno de
campo**: eliges un tipo (Fuego, Agua, Fantasma…) y "sales de expedición" a ese territorio.
La app muestra:

- La **ficha del tipo**: contra qué tipos es fuerte, ante cuáles es débil y a cuáles es inmune.
- Las **especies** de ese tipo en tarjetas con ilustración, medidas y barras de estadísticas.
- Un **resumen calculado** de lo que hay en pantalla: media de stats, el más fuerte, el más
  rápido y el más pesado, y con qué otros tipos se combina el tipo explorado.
- **Búsqueda** por nombre o número, **ordenación** (número, nombre, stats, velocidad, peso) y
  paginación con **"Cargar más"**.
- **Caché en `localStorage`** (bonus), con un contador de cuántas respuestas vinieron de la red y
  cuántas de la caché.

## Cómo probarlo

Requisitos: Node.js 20.19+ o 22.12+.

```bash
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # versión de producción en /dist
npm run preview   # sirve el build para probarlo
```

Se puede abrir directamente un tipo con la URL, por ejemplo `http://localhost:5173/#ghost`.

## Estructura

```
├── index.html            # Esqueleto semántico de la página
├── package.json          # Scripts de Vite y dependencias
├── public/
│   └── favicon.svg
└── src/
    ├── main.js           # Orquestador: eventos, estado y flujo de carga
    ├── style.css
    ├── api/
    │   ├── http.js       # ÚNICO sitio con fetch: response.ok, timeout, caché, errores
    │   └── pokeapi.js    # Endpoints de la PokeAPI y carga en paralelo
    ├── lib/
    │   ├── adaptadores.js# Respuesta cruda de la API → objetos pequeños y seguros
    │   ├── transform.js  # Filtrar, ordenar, resumir y agrupar (funciones puras)
    │   ├── cache.js      # Caché en localStorage con caducidad (bonus)
    │   └── utils.js      # debounce
    ├── data/
    │   └── tipos.js      # Nombres en español y colores de cada tipo
    └── ui/
        └── render.js     # Todo lo que toca el DOM
```

Cada capa solo conoce a la de debajo: `main.js` → `api/` y `lib/` → `ui/`. La API no pinta
nada y el render no hace peticiones.

## Cómo cumple cada criterio

### Asincronía
- `async/await` con `try/catch` en todo el flujo (`main.js`, `http.js`).
- `http.js` comprueba **`response.ok`** (fetch no rechaza con 404/500), lanza un `ErrorHttp`
  propio y pone un tiempo máximo con **`AbortSignal.timeout`**.
- Los Pokémon de cada página se piden **en paralelo** con `Promise.allSettled`: si uno falla no
  se pierden los demás, y se informa de cuántos fallaron con un botón para reintentarlos.
- **Estados visibles**: cargando (mensaje y tarjetas esqueleto), error (mensaje legible y
  botón *Reintentar*) y vacío (tipo sin especies o búsqueda sin resultados).
- **Turnos de petición**: si cambias de tipo mientras otro está cargando, la respuesta antigua se
  descarta y no se pinta encima de la nueva.

### Transformación de datos
Sin bucles manuales: `map`, `filter`, `reduce`, `find`, `toSorted`, `Object.groupBy`,
`Object.fromEntries/entries`, `slice`. Por ejemplo, el resumen se calcula con un **único
`reduce`**, y las combinaciones de tipo con `Object.groupBy`. Todo es inmutable (`toSorted` en
vez de `sort`).

### Robustez
- Los adaptadores usan `?.` y `??`: si falta la imagen, los tipos o las stats, la tarjeta se pinta
  igual con valores por defecto. Un Pokémon sin `id` válido se descarta.
- Se filtran las formas alternativas (id > 1025) y los tipos sin Pokémon (`unknown`, `shadow`,
  `stellar`).
- Si una imagen no carga, se sustituye por un marcador en lugar de un icono roto.
- La caché tolera JSON corrupto, cuota llena (borra las entradas más antiguas) y `localStorage`
  bloqueado (modo privado): en el peor caso la app funciona sin caché.
- Todo el texto de la API se inserta con `textContent`, nunca con `innerHTML` (protección frente a XSS).

### Bonus: caché en `localStorage`
Se guardan las respuestas **ya adaptadas** (unos cientos de bytes por Pokémon en vez de los
~300 KB de la respuesta original), con fecha de guardado y caducidad de 24 h. La barra de estado
muestra cuántas respuestas vinieron de la red y cuántas de la caché, y hay un botón para vaciarla.
Se puede inspeccionar en *DevTools → Application → Local Storage* (claves `async-odyssey:v1:…`).

## Uso de IA

Usé **Claude Code** (modelo Claude Opus 5.5, de Anthropic) dentro de VS Code. La IA generó el
código de todos los módulos, los estilos y este README, y lo fue subiendo en commits por fases
(estructura con Vite → capa de API → render con estados → caché y robustez → documentación).

Prompts reales relevantes:

- *"Te he añadido dos archivos del temario que hemos dado en la asignatura, tengo que hacer un
  proyecto [...] también deberás hacer 5 commits en GitHub de distintas fases a medida que
  avanza."* (junto con los PDF de las Unidades 1 y 2 y el enunciado de la Misión 2).
- *"Necesito que me ayudes paso a paso a vincular el GitHub para que puedas hacer tú los
  commits."*

Cómo verifiqué lo generado:

- Antes de cada commit, la IA ejecutó los módulos con Node contra la PokeAPI real: carga en
  paralelo, uso de la caché en la segunda petición, error 404 legible y datos vacíos o
  malformados. También comprobé que `npm run build` compila sin errores.
- Probé la app en el navegador con `npm run dev`: selección de tipos, búsqueda, ordenación,
  "Cargar más", el estado de error simulando la red desconectada (DevTools → Network →
  Offline) y la caché en *Application → Local Storage*.
- Estudié el código con una guía de defensa para poder explicar cada parte.

Qué escribí a mano: el código fue generado por la IA; mi trabajo fue dirigir el proyecto por
fases, crear y vincular el repositorio público, probar la aplicación y revisar el código.

## Autopsia

1. **La ordenación solo afecta a los Pokémon ya cargados.** Al elegir un tipo cargo los 24
   primeros y el selector "Ordenar los mostrados por" ordena solo esos. Si se pulsa "Cargar
   más", se reordena todo lo cargado, y al llegar al final el orden ya es el de todo el tipo.
   Descarté descargar todas las especies del tipo nada más entrar para ordenarlas globalmente:
   las estadísticas solo vienen en el detalle de cada Pokémon, así que serían 81 peticiones en
   Fuego (más de 100 en Agua) antes de enseñar nada. Preferí que la página cargue rápido y haga
   solo las peticiones necesarias, aunque el orden por stats sea parcial hasta cargarlo todo.

2. **Las respuestas que llegan tarde se ignoran con un contador `turno`, no se cancelan.** Cada
   carga recibe un número (`const miTurno = ++turno`) y, al volver del `await`, si
   `miTurno !== turno` es que el usuario ya ha cambiado de tipo y la respuesta se descarta sin
   pintarla. Descarté `AbortController`, que cancelaría la petición de verdad: obliga a pasar la
   señal desde `main.js` hasta `fetch` a través de `pokeapi.js` y `http.js`, y a distinguir el
   error de "petición abortada" de los errores reales para no enseñar "No se pudo conectar" al
   cambiar de tipo. Además, como `pedirJson` guarda la respuesta en caché antes de devolverla, lo
   descargado no se pierde: si se vuelve a ese tipo, carga al instante. El coste es que, con
   conexiones lentas, las peticiones viejas siguen gastando red aunque no se vayan a mostrar.

## Créditos

Datos e imágenes: [PokeAPI](https://pokeapi.co) y su repositorio de sprites. Pokémon y sus
nombres son marcas de Nintendo / Game Freak / The Pokémon Company. Proyecto con fines
exclusivamente educativos.
