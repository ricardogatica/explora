import { Link } from "react-router";

/* Piezas compartidas por las fichas. Cuatro clases de objeto —cuerpos,
   estrellas, constelaciones y galaxias— comparten un solo componente: es lo que
   evita que se vayan pareciendo cada vez menos, como pasó con los dos app.js de
   las materias. */

export function Migas({ tramos }) {
  return (
    <nav className="crumbs" aria-label="Ruta de navegación">
      <a href="/">Explora</a>
      <span> › </span>
      <Link to="/">Universo</Link>
      {tramos.map(tramo => (
        <span key={tramo.texto}>
          {" › "}
          {tramo.a ? <Link to={tramo.a}>{tramo.texto}</Link> : <span aria-current="page">{tramo.texto}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Ficha({ ficha, hermanos, children }) {
  return (
    <main className="pagina">
      <Migas tramos={[{ texto: "Índice", a: "/indice" }, { texto: ficha.titulo }]} />
      <p className="eyebrow">{ficha.tipo}</p>
      <h1>{ficha.titulo}</h1>
      <p className="subtitle">{ficha.descripcion}</p>

      {children}

      <dl className="datos">
        {ficha.datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>

      {ficha.aviso && <p className="aviso">{ficha.aviso}</p>}
      {ficha.nota && <p className="nota">{ficha.nota}</p>}

      {ficha.estrellas?.length > 0 && (
        <>
          <h2>Estrellas de la figura ({ficha.estrellas.length})</h2>
          <div className="rejilla">
            {ficha.estrellas.map(estrella => (
              <Link key={estrella.slug} className="tarjeta" to={`/estrellas/${estrella.slug}`}>
                <strong>{estrella.nombre}</strong>
                <span>magnitud {estrella.magnitud} · {estrella.tipo}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {hermanos && (
        <nav className="hermanos">
          {hermanos.anterior
            ? <Link className="boton boton--suave" to={hermanos.anterior.a}>‹ {hermanos.anterior.texto}</Link>
            : <span />}
          {hermanos.siguiente &&
            <Link className="boton boton--suave" to={hermanos.siguiente.a}>{hermanos.siguiente.texto} ›</Link>}
        </nav>
      )}
    </main>
  );
}

/* Una ficha que no existe: pasa cuando alguien teclea la URL o llega desde un
   enlace viejo, y decirlo es más útil que una página en blanco. */
export function NoExiste({ que }) {
  return (
    <main className="pagina">
      <Migas tramos={[{ texto: "Índice", a: "/indice" }, { texto: "No encontrado" }]} />
      <h1>Aquí no hay nada</h1>
      <p className="subtitle">No existe {que} con ese nombre.</p>
      <p><Link className="boton" to="/indice">Ver el índice del universo</Link></p>
    </main>
  );
}
