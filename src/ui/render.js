// Todo lo que pinta en el DOM. Se construyen nodos con textContent
// (nunca innerHTML con datos externos) para evitar XSS.
import { infoTipo, ETIQUETAS_STATS } from '../data/tipos.js';

const STAT_MAXIMA = 255;

function crear(etiqueta, { clase, texto, atributos = {} } = {}, hijos = []) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  Object.entries(atributos).forEach(([nombre, valor]) => el.setAttribute(nombre, valor));
  el.append(...hijos);
  return el;
}

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
const formatearNumero = (id) => `#${String(id).padStart(4, '0')}`;
export const nombreBonito = (nombre) => capitalizar(String(nombre).replaceAll('-', ' '));

function insignia(tipo) {
  const { es, color, claro } = infoTipo(tipo);
  const el = crear('span', { clase: `insignia${claro ? ' insignia--clara' : ''}`, texto: es });
  el.style.setProperty('--color-tipo', color);
  return el;
}

/* ---------- Selector de tipos ---------- */

export function pintarTipos(contenedor, tipos, activo) {
  const botones = tipos.map((tipo) => {
    const { es, color } = infoTipo(tipo);
    const boton = crear('button', {
      clase: 'tipo',
      texto: es,
      atributos: { type: 'button', 'data-tipo': tipo, 'aria-pressed': String(tipo === activo) },
    });
    boton.style.setProperty('--color-tipo', color);
    return boton;
  });
  contenedor.replaceChildren(...botones);
}

export function marcarTipoActivo(contenedor, activo) {
  contenedor
    .querySelectorAll('[data-tipo]')
    .forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.tipo === activo)));
}

/* ---------- Estados: cargando, error, vacío ---------- */

export function pintarCargando(contenedor, mensaje = 'Cargando…', esqueletos = 8) {
  const tarjetasFantasma = Array.from({ length: esqueletos }, () =>
    crear('div', { clase: 'tarjeta tarjeta--esqueleto', atributos: { 'aria-hidden': 'true' } }),
  );
  contenedor.replaceChildren(
    crear('p', { clase: 'estado estado--cargando', texto: mensaje, atributos: { role: 'status' } }),
    ...(esqueletos > 0 ? [crear('div', { clase: 'rejilla' }, tarjetasFantasma)] : []),
  );
}

export function pintarError(contenedor, mensaje, alReintentar) {
  const boton = crear('button', { clase: 'boton', texto: 'Reintentar', atributos: { type: 'button' } });
  boton.addEventListener('click', alReintentar, { once: true });
  contenedor.replaceChildren(
    crear('div', { clase: 'estado estado--error', atributos: { role: 'alert' } }, [
      crear('p', { texto: `⚠ ${mensaje}` }),
      boton,
    ]),
  );
}

export function pintarVacio(contenedor, mensaje) {
  contenedor.replaceChildren(crear('p', { clase: 'estado estado--vacio', texto: mensaje }));
}

/* ---------- Ficha del tipo ---------- */

function filaRelacion(etiqueta, tipos) {
  const contenido = tipos.length ? tipos.map(insignia) : [crear('span', { clase: 'nada', texto: 'ninguno' })];
  return crear('div', { clase: 'relacion' }, [crear('dt', { texto: etiqueta }), crear('dd', {}, contenido)]);
}

export function pintarFichaTipo(contenedor, tipo) {
  const { es, color } = infoTipo(tipo.nombre);
  contenedor.style.setProperty('--color-tipo', color);
  contenedor.replaceChildren(
    crear('h3', { clase: 'ficha__titulo', texto: `Destino: tipo ${es}` }),
    crear('p', { clase: 'ficha__subtitulo', texto: `${tipo.pokemon.length} especies avistadas en este territorio` }),
    crear('dl', { clase: 'ficha__relaciones' }, [
      filaRelacion('Fuerte contra', tipo.fuerteContra),
      filaRelacion('Débil ante', tipo.debilContra),
      filaRelacion('Inmune a', tipo.inmuneA),
    ]),
  );
}

/* ---------- Resumen calculado ---------- */

function dato(etiqueta, valor) {
  return crear('div', { clase: 'dato' }, [
    crear('span', { clase: 'dato__valor', texto: valor }),
    crear('span', { clase: 'dato__etiqueta', texto: etiqueta }),
  ]);
}

export function pintarResumen(contenedor, resumen, companeros, tipoActual) {
  if (!resumen) {
    contenedor.replaceChildren();
    return;
  }
  const { es } = infoTipo(tipoActual);
  const chips = companeros.map(({ tipo, cantidad }) => {
    const etiqueta =
      tipo === 'puro' ? crear('span', { clase: 'insignia insignia--puro', texto: `Solo ${es}` }) : insignia(tipo);
    return crear('li', { clase: 'companero' }, [etiqueta, crear('span', { texto: `× ${cantidad}` })]);
  });

  contenedor.replaceChildren(
    crear('div', { clase: 'datos' }, [
      dato('en pantalla', String(resumen.cantidad)),
      dato('media de stats', String(resumen.mediaTotal)),
      dato('el más fuerte', nombreBonito(resumen.masFuerte.nombre)),
      dato('el más rápido', nombreBonito(resumen.masRapido.nombre)),
      dato('el más pesado', `${nombreBonito(resumen.masPesado.nombre)} · ${resumen.masPesado.pesoKg} kg`),
    ]),
    crear('p', { clase: 'resumen__titulo', texto: 'Combinaciones de tipo entre los mostrados' }),
    crear('ul', { clase: 'companeros' }, chips),
  );
}

/* ---------- Tarjetas de Pokémon ---------- */

const marcadorSinImagen = () =>
  crear('div', { clase: 'tarjeta__imagen tarjeta__imagen--vacia', texto: '?', atributos: { 'aria-hidden': 'true' } });

function barraStat(clave, valor) {
  const relleno = crear('span', { clase: 'stat__relleno' });
  relleno.style.width = `${Math.min(100, (valor / STAT_MAXIMA) * 100)}%`;
  return crear('div', { clase: 'stat' }, [
    crear('span', { clase: 'stat__nombre', texto: ETIQUETAS_STATS[clave] ?? clave }),
    crear('span', { clase: 'stat__barra' }, [relleno]),
    crear('span', { clase: 'stat__valor', texto: String(valor) }),
  ]);
}

function tarjeta(pokemon) {
  const { id, nombre, imagen, tipos, stats, total, alturaM, pesoKg } = pokemon;

  let ilustracion = marcadorSinImagen();
  if (imagen) {
    ilustracion = crear('img', {
      clase: 'tarjeta__imagen',
      atributos: { src: imagen, alt: `Ilustración de ${nombre}`, loading: 'lazy', width: '160', height: '160' },
    });
    // Si la imagen no carga, se cambia por el marcador en lugar de mostrar un icono roto.
    ilustracion.addEventListener('error', (e) => e.currentTarget.replaceWith(marcadorSinImagen()), { once: true });
  }

  const elemento = crear('article', { clase: 'tarjeta' }, [
    crear('div', { clase: 'tarjeta__cabecera' }, [
      crear('span', { clase: 'tarjeta__numero', texto: formatearNumero(id) }),
      crear('span', { clase: 'tarjeta__total', texto: `Σ ${total}`, atributos: { title: 'Suma de estadísticas base' } }),
    ]),
    ilustracion,
    crear('h3', { clase: 'tarjeta__nombre', texto: nombreBonito(nombre) }),
    crear('div', { clase: 'tarjeta__tipos' }, tipos.map(insignia)),
    crear('p', { clase: 'tarjeta__medidas', texto: `${alturaM} m · ${pesoKg} kg` }),
    crear('div', { clase: 'tarjeta__stats' }, Object.entries(stats).map(([clave, valor]) => barraStat(clave, valor))),
  ]);
  elemento.style.setProperty('--color-tipo', infoTipo(tipos[0]).color);
  return elemento;
}

export function pintarTarjetas(contenedor, lista) {
  contenedor.replaceChildren(crear('div', { clase: 'rejilla' }, lista.map(tarjeta)));
}
