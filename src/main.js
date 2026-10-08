// Orquestador: conecta eventos del usuario, API, lógica y render.
import './style.css';
import { obtenerTipos, obtenerTipo, obtenerVariosPokemon } from './api/pokeapi.js';
import { ordenar, resumir, companerosDeTipo } from './lib/transform.js';
import {
  pintarTipos,
  marcarTipoActivo,
  pintarCargando,
  pintarError,
  pintarVacio,
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
  resumen: $('#resumen'),
  resultados: $('#resultados'),
};

async function iniciar() {
  pintarCargando(dom.tipos, 'Cargando el mapa de tipos…', 0);
  try {
    const tipos = await obtenerTipos();
    if (tipos.length === 0) {
      pintarError(dom.tipos, 'La API no ha devuelto ningún tipo.', iniciar);
      return;
    }
    pintarTipos(dom.tipos, tipos, null);
  } catch (error) {
    pintarError(dom.tipos, error.message, iniciar);
  }
}

async function explorarTipo(nombre) {
  marcarTipoActivo(dom.tipos, nombre);
  dom.expedicion.hidden = false;
  dom.ficha.replaceChildren();
  dom.resumen.replaceChildren();
  pintarCargando(dom.resultados, 'Preparando la expedición…');

  try {
    const tipo = await obtenerTipo(nombre);
    pintarFichaTipo(dom.ficha, tipo);

    if (tipo.pokemon.length === 0) {
      pintarVacio(dom.resultados, 'Este territorio está desierto: no hay Pokémon de este tipo.');
      return;
    }

    pintarCargando(dom.resultados, `Avistando ${Math.min(POR_PAGINA, tipo.pokemon.length)} Pokémon…`);
    const ids = tipo.pokemon.slice(0, POR_PAGINA).map((ref) => ref.id);
    const { pokemon } = await obtenerVariosPokemon(ids);

    if (pokemon.length === 0) {
      pintarError(dom.resultados, 'No se pudo cargar ningún Pokémon.', () => explorarTipo(nombre));
      return;
    }

    const lista = ordenar(pokemon, 'id');
    pintarResumen(dom.resumen, resumir(lista), companerosDeTipo(lista, nombre), nombre);
    pintarTarjetas(dom.resultados, lista);
  } catch (error) {
    pintarError(dom.resultados, error.message, () => explorarTipo(nombre));
  }
}

// Delegación de eventos: un solo listener para todos los botones de tipo.
dom.tipos.addEventListener('click', (event) => {
  const boton = event.target.closest('[data-tipo]');
  if (boton) explorarTipo(boton.dataset.tipo);
});

iniciar();
