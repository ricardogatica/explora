import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Migas } from "../componentes.jsx";
import { buildCatalog, normalizeSearch } from "../../../sistema_solar/nav-model.js";
import { rutaDeEntrada } from "../datos/rutas.js";

export function meta() {
  return [
    { title: "Índice del universo · Explora" },
    { name: "description", content: "Todas las fichas del universo: cuerpos del sistema solar, estrellas, constelaciones y galaxias." }
  ];
}

const CATALOGO = buildCatalog();
const TOTAL = CATALOGO.reduce((suma, grupo) => suma + grupo.entries.length, 0);

export default function Indice() {
  const [consulta, setConsulta] = useState("");
  const termino = normalizeSearch(consulta.trim());

  /* El filtro compara contra `search`, que el catálogo guarda sin tildes: se
     puede escribir «orion» y encontrar Orión. Es la decisión contraria a la de
     corregir respuestas, y por el mismo motivo: buscar tiene que perdonar. */
  const grupos = useMemo(() => CATALOGO.map(grupo => ({
    ...grupo,
    entries: termino ? grupo.entries.filter(e => e.search.includes(termino)) : grupo.entries
  })).filter(grupo => grupo.entries.length > 0), [termino]);

  const encontradas = grupos.reduce((suma, grupo) => suma + grupo.entries.length, 0);

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: "Índice" }]} />
      <p className="eyebrow">Todo el universo</p>
      <h1>Índice</h1>
      <p className="subtitle">
        {TOTAL} fichas entre cuerpos del sistema solar, estrellas, constelaciones y galaxias.
      </p>

      <div className="buscador">
        <input
          className="buscador__campo" type="search" value={consulta}
          onChange={evento => setConsulta(evento.target.value)}
          placeholder="Buscar una estrella, un planeta, una constelación…"
          aria-label="Buscar en el índice del universo"
        />
        <span className="buscador__cuenta">
          {termino ? `${encontradas} de ${TOTAL} fichas` : `${TOTAL} fichas`}
        </span>
      </div>

      {grupos.length === 0
        ? <p className="vacio">No hay ninguna ficha que se llame así.</p>
        : grupos.map(grupo => (
            <section key={grupo.id}>
              <h2>{grupo.title} ({grupo.entries.length})</h2>
              <div className="rejilla">
                {grupo.entries.map(entrada => (
                  <Link key={entrada.slug} className="tarjeta" to={rutaDeEntrada(grupo.id, entrada.slug)}>
                    <strong>{entrada.name}</strong>
                    <span>{entrada.detail}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
    </main>
  );
}
