import { breadcrumbFor, destinationsFor, resolveContext, siblingsFor } from "./nav-model.js";

function currentContext() {
  return resolveContext({
    dataset: document.body.dataset,
    search: location.search,
    filename: location.pathname.split("/").pop() || "index.html"
  });
}

function renderCrumbs(context) {
  const nav = document.createElement("nav");
  nav.className = "crumbs";
  nav.setAttribute("aria-label", "Ruta de navegación");

  breadcrumbFor(context).forEach((crumb, index) => {
    if (index > 0) {
      const separator = document.createElement("i");
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = "›";
      nav.appendChild(separator);
    }
    if (crumb.href) {
      const link = document.createElement("a");
      link.href = crumb.href;
      link.textContent = crumb.label;
      nav.appendChild(link);
    } else {
      const current = document.createElement("span");
      current.setAttribute("aria-current", "page");
      current.textContent = crumb.label;
      nav.appendChild(current);
    }
  });
  return nav;
}

function renderSiblings(context) {
  const { prev, next } = siblingsFor(context.slug, { filename: context.filename });
  if (!prev && !next) return null;

  const nav = document.createElement("nav");
  nav.className = "siblings";
  nav.setAttribute("aria-label", "Cuerpos vecinos");

  if (prev) {
    const link = document.createElement("a");
    link.className = "btn btn--prev";
    link.href = prev.href;
    link.textContent = `‹ ${prev.name}`;
    nav.appendChild(link);
  }
  if (next) {
    const link = document.createElement("a");
    link.className = "btn btn--next";
    link.href = next.href;
    link.textContent = `${next.name} ›`;
    nav.appendChild(link);
  }
  return nav;
}

// .hud es pointer-events:none para dejar pasar el arrastre al canvas, pero
// .side-card lo revierte (styles.css) porque con overflow:auto necesita recibir
// la rueda. Los manejadores de la escena 3D (main.js, solar-scale.js,
// universe-body.js, constellations-view.js) escuchan en window en fase de
// burbujeo, así que cortar la propagación en la propia tarjeta basta para que no
// los alcance: la escena no se toca.
//
//  - wheel: sin esto la rueda sobre la tarjeta la desplazaría y haría zoom a la
//    vez. Al no llegar a window tampoco se llama a su preventDefault, y el
//    navegador desplaza la tarjeta con normalidad. Solo se corta si la tarjeta
//    desborda: cuando no hay nada que desplazar (solar-scale.html no desborda en
//    ningún viewport probado) quitarle el zoom a la escena sería coste sin
//    beneficio. Se comprueba en cada evento porque el desborde depende del
//    viewport y de lo que la vista haya pintado dentro.
//  - pointerdown: la tarjeta es pulsable en toda su superficie, no solo en
//    .bottom-actions, así que sin esto cualquier pulsación lanzaría además el
//    raycast y podría reenfocar el cuerpo que queda detrás.
//
// Se aplica antes de cualquier return de renderNav(): esa función se salta
// index.html y las páginas sin tarjeta, pero el aislamiento tiene que valer para
// cualquier página con .side-card, inyecte migas o no. Es idempotente, así que
// los repintados de constellations-view.js no acumulan manejadores.
function isolateCardFromScene() {
  const card = document.querySelector(".side-card");
  if (!card || card.dataset.sceneIsolated === "true") return;
  card.dataset.sceneIsolated = "true";
  card.addEventListener("wheel", event => {
    if (card.scrollHeight > card.clientHeight) event.stopPropagation();
  }, { passive: true });
  card.addEventListener("pointerdown", event => event.stopPropagation());
}

// Botones a las demás vistas generales, en la ranura que la página declare con
// data-destinos. La ranura es explícita en lugar de adivinada: cada vista decide
// dónde caben sus botones, y las fichas —que ya tienen migas y hermanos— no la
// declaran, así que no reciben nada.
//
// Se rellena una sola vez: dataset.destinos marca la ranura ya servida para que
// los repintados de constellations-view.js no acumulen botones.
function renderDestinations(filename) {
  const slot = document.querySelector("[data-destinos]");
  if (!slot || slot.dataset.destinos === "listo") return;
  slot.dataset.destinos = "listo";
  destinationsFor(filename).forEach(destination => {
    const link = document.createElement("a");
    link.className = "btn";
    link.href = destination.href;
    link.textContent = destination.label;
    slot.appendChild(link);
  });
}

// Nodos ya inyectados, para poder repintar sin duplicar ni tener que buscarlos
// otra vez en un DOM que la vista de turno puede haber tocado.
let crumbsNode = null;
let siblingsNode = null;

// Repinta la navegación desde la URL actual. Las vistas que cambian el ?slug=
// con replaceState (constellations-view.js) la llaman para que la miga no se
// quede en el cuerpo con el que se entró; así la construcción de migas vive en
// un solo sitio y no hay que duplicarla en cada vista.
export function renderNav() {
  isolateCardFromScene();
  const context = currentContext();

  // Antes del return de index.html: esa página no lleva migas pero sí los
  // botones a las demás vistas.
  renderDestinations(context.filename);

  // No inyectar en index.html: ya tiene su propio botón "← Explora" (uno para
  // escritorio en el panel de título y otro flotante para móvil, donde ese
  // panel se oculta). Una miga ahí duplicaría función.
  if (context.page === "index") return;

  // Preferir .side-card (fichas y la mayoría de páginas).
  // Si no existe, usar el primer .panel (referencias.html y similares).
  const card = document.querySelector(".side-card") || document.querySelector(".panel");
  if (!card) return;

  const crumbs = renderCrumbs(context);
  if (crumbsNode?.isConnected) crumbsNode.replaceWith(crumbs);
  else card.insertBefore(crumbs, card.firstChild);
  crumbsNode = crumbs;

  const siblings = renderSiblings(context);
  if (siblingsNode?.isConnected) {
    if (siblings) siblingsNode.replaceWith(siblings);
    else siblingsNode.remove();
  } else if (siblings) {
    (card.querySelector(".bottom-actions") || card).appendChild(siblings);
  }
  siblingsNode = siblings;
}

renderNav();
