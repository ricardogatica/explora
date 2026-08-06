import { breadcrumbFor, resolveContext, siblingsFor } from "./nav-model.js";

const context = resolveContext({
  dataset: document.body.dataset,
  search: location.search,
  filename: location.pathname.split("/").pop() || "index.html"
});

function renderCrumbs() {
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

function renderSiblings() {
  const { prev, next } = siblingsFor(context.slug);
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

// No inyectar en index.html: ya tiene su propio botón "← Explora" y recibirá
// un botón "Índice del universo" en tarea posterior. Una miga ahí duplicaría función.
if (context.page !== "index") {
  // Preferir .side-card (fichas y la mayoría de páginas).
  // Si no existe, usar el primer .panel (referencias.html y similares).
  const card = document.querySelector(".side-card") || document.querySelector(".panel");
  if (card) {
    card.insertBefore(renderCrumbs(), card.firstChild);
    const siblings = renderSiblings();
    if (siblings) (card.querySelector(".bottom-actions") || card).appendChild(siblings);
  }
}
