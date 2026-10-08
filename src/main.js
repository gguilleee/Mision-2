// Orquestador: conecta eventos del usuario, API, lógica y render.
// No hace fetch ni construye HTML por sí mismo: delega en los otros módulos.
import './style.css';
import { obtenerTipos, obtenerTipo, obtenerVariosPokemon } from './api/pokeapi.js';
import { tomarMetricas } from './api/http.js';
import { vaciarCache } from './lib/cache.js';
import { ordenar, filtrarPorNombre, resumir, companerosDeTipo } from './lib/transform.js';
import { debounce } from './lib/utils.js';
import { infoTipo } from './data/tipos.js';
import {
  pintarTipos,
  marcarTipoActivo,
  pintarCargando,
  pintarError,
  pintarVacio,
  pintarBarraEstado,
  pintarFichaTipo,
  pintarResumen,
  pintarTarjetas,
} from './ui/render.js';

const POR_PAGINA = 24;

const $ = (selector) => document.querySelector(selector);
const dom = {
  tipos: $('#tipos'),
  expedicion: $('#expedicion'),
  ficha: $('#ficha'),
  controles: $('#controles'),
  buscador: $('#buscador'),
  orden: $('#orden'),
  vaciarCache: $('#vaciar-cache'),
  barraEstado: $('#barra-estado'),
  resumen: $('#resumen'),
  resultados: $('#resultados'),
  cargarMas: $('#cargar-mas'),
};

const estado = {
  tipo: null, // { nombre, pokemon: [{ nombre, id }], fuerteContra, … }
  detalles: new Map(), // id → Pokémon adaptado. Se conserva entre tipos: un Pokémon dual sirve para ambos.
  busqueda: '',
  orden: 'id',
  limite: POR_PAGINA,
};

// Cada carga recibe un número de turno. Si el usuario cambia de tipo o de
// búsqueda mientras una petición sigue en vuelo, su respuesta llega con un
// turno viejo y se descarta: así nunca se pintan datos de otro tipo.
let turno = 0;

const referenciasVisibles = () => filtrarPorNombre(estado.tipo?.pokemon ?? [], estado.busqueda);

/* ---------- Flujo principal ---------- */

async function iniciar() {
  pintarCargando(dom.tipos, 'Cargando el mapa de tipos…', 0);
  try {
    const tipos = await obtenerTipos();
    if (tipos.length === 0) {
      pintarError(dom.tipos, 'La API no ha devuelto ningún tipo.', iniciar);
      return;
    }
    pintarTipos(dom.tipos, tipos, null);

    // Si la URL trae un tipo (#fire), la expedición arranca directamente ahí.
    const tipoEnUrl = decodeURIComponent(location.hash.slice(1));
    if (tipos.includes(tipoEnUrl)) explorarTipo(tipoEnUrl);
  } catch (error) {
    pintarError(dom.tipos, error.message, iniciar);
  }
}

async function explorarTipo(nombre) {
  const miTurno = ++turno;
  history.replaceState(null, '', `#${nombre}`);

  Object.assign(estado, { tipo: null, busqueda: '', limite: POR_PAGINA });
  dom.buscador.value = '';
  marcarTipoActivo(dom.tipos, nombre);
  dom.expedicion.hidden = false;
  dom.controles.hidden = true;
  dom.cargarMas.hidden = true;
  dom.ficha.replaceChildren();
  dom.resumen.replaceChildren();
  dom.barraEstado.textContent = '';
  pintarCargando(dom.resultados, `Preparando la expedición al tipo ${infoTipo(nombre).es}…`);

  try {
    const tipo = await obtenerTipo(nombre);
    if (miTurno !== turno) return;

    estado.tipo = tipo;
    pintarFichaTipo(dom.ficha, tipo);
    await cargarYMostrar(miTurno);
  } catch (error) {
    if (miTurno !== turno) return;
    pintarError(dom.resultados, error.message, () => explorarTipo(nombre));
  }
}

/** Pide (en paralelo) los Pokémon visibles que aún no tenemos y repinta. */
async function cargarYMostrar(miTurno = ++turno) {
  if (!estado.tipo) return;

  const pendientes = referenciasVisibles()
    .slice(0, estado.limite)
    .filter((ref) => !estado.detalles.has(ref.id));

  if (pendientes.length > 0) {
    const yaHayTarjetas = dom.resultados.querySelector('.tarjeta:not(.tarjeta--esqueleto)') !== null;
    if (yaHayTarjetas) {
      dom.cargarMas.disabled = true;
      dom.cargarMas.textContent = 'Avistando…';
    } else {
      pintarCargando(dom.resultados, `Avistando ${pendientes.length} Pokémon…`);
    }

    // obtenerVariosPokemon usa allSettled: nunca rechaza, informa de los perdidos.
    const { pokemon } = await obtenerVariosPokemon(pendientes.map((ref) => ref.id));
    if (miTurno !== turno) return;
    pokemon.forEach((p) => estado.detalles.set(p.id, p));
  }

  mostrar();
}

/** Solo pinta: a partir del estado actual, sin peticiones. */
function mostrar() {
  const { tipo, busqueda, limite, orden } = estado;
  const referencias = referenciasVisibles();
  const enPagina = referencias.slice(0, limite);
  const lista = ordenar(
    enPagina.map((ref) => estado.detalles.get(ref.id)).filter(Boolean),
    orden,
  );

  dom.controles.hidden = tipo.pokemon.length === 0;
  dom.cargarMas.hidden = referencias.length <= limite || lista.length === 0;
  dom.cargarMas.disabled = false;
  dom.cargarMas.textContent = `Cargar más (${referencias.length - Math.min(limite, referencias.length)} restantes)`;

  if (tipo.pokemon.length === 0) {
    pintarVacio(dom.resultados, 'Este territorio está desierto: no hay Pokémon de este tipo.');
  } else if (referencias.length === 0) {
    pintarVacio(dom.resultados, `Ningún Pokémon de tipo ${infoTipo(tipo.nombre).es} coincide con «${busqueda}».`);
  } else if (lista.length === 0) {
    pintarError(dom.resultados, 'No se pudo cargar ningún Pokémon de esta página.', () => cargarYMostrar());
  } else {
    pintarTarjetas(dom.resultados, lista);
  }

  pintarResumen(dom.resumen, resumir(lista), companerosDeTipo(lista, tipo.nombre), tipo.nombre);
  pintarBarraEstado(
    dom.barraEstado,
    {
      mostrados: lista.length,
      coincidencias: referencias.length,
      perdidos: enPagina.length - lista.length,
      metricas: tomarMetricas(),
    },
    () => cargarYMostrar(),
  );
}

/* ---------- Eventos ---------- */

// Delegación: un solo listener para todos los botones de tipo.
dom.tipos.addEventListener('click', (event) => {
  const boton = event.target.closest('[data-tipo]');
  if (boton) explorarTipo(boton.dataset.tipo);
});

// Debounce: no se lanza una búsqueda por cada tecla, sino al dejar de escribir.
dom.buscador.addEventListener(
  'input',
  debounce((event) => {
    estado.busqueda = event.target.value;
    estado.limite = POR_PAGINA;
    cargarYMostrar();
  }, 300),
);

dom.orden.addEventListener('change', (event) => {
  estado.orden = event.target.value;
  if (estado.tipo) mostrar(); // reordenar no necesita pedir nada nuevo
});

dom.cargarMas.addEventListener('click', () => {
  estado.limite += POR_PAGINA;
  cargarYMostrar();
});

dom.vaciarCache.addEventListener('click', () => {
  const borradas = vaciarCache();
  dom.barraEstado.textContent = `Caché vaciada: ${borradas} respuestas eliminadas. Las próximas cargas irán a la red.`;
});

iniciar();
