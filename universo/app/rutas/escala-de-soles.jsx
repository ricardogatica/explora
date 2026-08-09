import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { estrella, numero, veces, comparacionDeVolumen } from "../datos/soles.js";

export function meta() {
  return [
    { title: "Escala de soles · Universo · Explora" },
    { name: "description", content: "Nueve estrellas comparadas por tamaño, de Próxima Centauri a Betelgeuse." }
  ];
}

export default function EscalaDeSoles() {
  const contenedor = useRef(null);
  const escena = useRef(null);
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    let montada = null, cancelado = false;
    import("../escenas/escala-de-soles.js").then(({ montarEscalaDeSoles }) => {
      if (cancelado || !contenedor.current) return;
      montada = montarEscalaDeSoles(contenedor.current, { alElegir: setSlug });
      escena.current = montada;
    });
    return () => { cancelado = true; montada?.desmontar(); escena.current = null; };
  }, []);

  const sol = slug ? estrella(slug) : null;
  const [etiquetaVolumen, valorVolumen] = sol ? comparacionDeVolumen(sol) : [];

  return (
    <div className="vista">
      <div ref={contenedor} className="vista__lienzo" />

      <section className="tarjeta-vista">
        <p className="eyebrow">Vista comparativa</p>
        <h1>Escala de soles</h1>
        <p>
          El Sol es la unidad: 1 R☉ son 696.340 km de radio. Próxima Centauri mide 0,15 R☉ y
          Betelgeuse 764, así que entre las dos hay un factor de casi cinco mil.
        </p>
        <p>
          Eso no cabe en una sola escala. La vista tiene tres filas —escala de referencia, 1:33 y
          1:323— y la mayor de cada fila se repite en la siguiente, ya pequeña: esa estrella
          repetida es la que deja ver cuánto ha cambiado la escala.
        </p>
        <p>Haz click en cualquier estrella para ver su ficha.</p>
        <div className="acciones-vista">
          <Link className="boton boton--suave" to="/">Volver al universo</Link>
          <Link className="boton boton--suave" to="/escala-planetaria">Ver escala planetaria</Link>
          <Link className="boton boton--suave" to="/indice">Índice</Link>
          <button type="button" className="boton" onClick={() => escena.current?.vistaGeneral()}>Reset</button>
        </div>
      </section>

      {sol && (
        <aside className="ficha-flotante">
          <button type="button" className="ficha-flotante__cerrar" onClick={() => setSlug(null)} aria-label="Cerrar la ficha">×</button>
          <h2>{sol.name}</h2>
          <p>{sol.radioNota ? `${sol.description} ${sol.radioNota}` : sol.description}</p>
          <dl className="datos datos--compactos">
            <div><dt>Tipo</dt><dd>{sol.type}</dd></div>
            <div><dt>Radio</dt><dd>{numero(sol.radioSolar)} R☉</dd></div>
            <div>
              <dt>De ancho frente al Sol</dt>
              <dd>{sol.slug === "sun" ? "Es la unidad de la escala" : veces(sol.radioSolar)}</dd>
            </div>
            <div><dt>{etiquetaVolumen}</dt><dd>{valorVolumen}</dd></div>
            <div><dt>Distancia</dt><dd>{sol.distance}</dd></div>
          </dl>
          {/* El Sol tiene ficha de cuerpo; las estrellas, de estrella. */}
          <Link className="boton" to={sol.slug === "sun" ? "/cuerpos/sun" : `/estrellas/${sol.slug}`}>
            Abrir ficha de {sol.name}
          </Link>
        </aside>
      )}
    </div>
  );
}
