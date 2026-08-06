import { buildCatalog, normalizeSearch } from "./nav-model.js";

const catalog = buildCatalog();
const groupsEl = document.getElementById("grupos");
const filterEl = document.getElementById("filtro");
const countEl = document.getElementById("conteo");

const total = catalog.reduce((n, group) => n + group.entries.length, 0);

function render(query = "") {
  const trimmed = query.trim();
  // `search` ya está normalizado sin tildes en nav-model.js: aquí se aplica
  // la misma normalización a lo que teclea el visitante, para que "orion"
  // encuentre "Orión" y viceversa.
  const needle = normalizeSearch(trimmed);
  groupsEl.textContent = "";
  let shown = 0;

  for (const group of catalog) {
    const matches = needle
      ? group.entries.filter(entry => entry.search.includes(needle))
      : group.entries;
    if (!matches.length) continue;
    shown += matches.length;

    const section = document.createElement("section");
    section.className = "panel indice__group";

    const heading = document.createElement("h2");
    heading.textContent = `${group.title} (${matches.length})`;
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "indice__list";

    for (const entry of matches) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "indice__item";
      link.href = entry.href;

      const name = document.createElement("strong");
      name.textContent = entry.name;
      link.appendChild(name);

      const detail = document.createElement("span");
      detail.className = "indice__detail";
      detail.textContent = entry.detail;
      link.appendChild(detail);

      if (entry.approximate) {
        const badge = document.createElement("span");
        badge.className = "indice__badge";
        badge.textContent = "datos aproximados";
        link.appendChild(badge);
      }
      item.appendChild(link);
      list.appendChild(item);
    }
    section.appendChild(list);
    groupsEl.appendChild(section);
  }

  if (needle && !shown) {
    // El término lo teclea el visitante: va a textContent, nunca a innerHTML.
    const empty = document.createElement("p");
    empty.className = "panel indice__empty";
    empty.textContent = `Sin resultados para "${trimmed}". Prueba con otro nombre, ` +
      "tipo de objeto o constelación.";
    groupsEl.appendChild(empty);
  }

  countEl.textContent = needle
    ? `${shown} de ${total} fichas`
    : `${total} fichas`;
}

filterEl.addEventListener("input", () => render(filterEl.value));
render();
