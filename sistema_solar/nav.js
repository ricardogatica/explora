import { breadcrumbFor, resolveContext, siblingsFor } from "./nav-model.js";

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

// Nodos ya inyectados, para poder repintar sin duplicar ni tener que buscarlos
// otra vez en un DOM que la vista de turno puede haber tocado.
let crumbsNode = null;
let siblingsNode = null;

// Repinta la navegación desde la URL actual. Las vistas que cambian el ?slug=
// con replaceState (constellations-view.js) la llaman para que la miga no se
// quede en el cuerpo con el que se entró; así la construcción de migas vive en
// un solo sitio y no hay que duplicarla en cada vista.
export function renderNav() {
  const context = currentContext();

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
