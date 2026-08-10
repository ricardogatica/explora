import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CONSTELLATIONS, CONSTELLATION_BY_SLUG, KNOWN_STAR_BY_SLUG } from "../../cielo/data.js";

export function meta() {
  return [
    { title: "Constelaciones · Universo · Explora" },
    { name: "description", content: "Las 88 constelaciones dibujadas con sus estrellas reales, sobre la esfera celeste." }
  ];
}

/* El mapa celeste. La ficha de cada constelación vive aparte, en
   /universo/constelaciones/<slug>, porque es una página de documento —con sus
   datos y su lista de estrellas— que un buscador puede indexar. Esto es para
   explorar, y guarda a dónde estás mirando en la URL (?ver=orion) para que un
   enlace al mapa pueda llegar con una figura ya enfocada. */
export default function Constelaciones() {
  const contenedor = useRef(null);
  const escena = useRef(null);
  const [parametros, setParametros] = useSearchParams();
  const [figura, setFigura] = useState(null);
  const [estrella, setEstrella] = useState(null);

  useEffect(() => {
    let montada = null, cancelado = false;
    import("../escenas/constelaciones.js").then(({ montarConstelaciones }) => {
      if (cancelado || !contenedor.current) return;
      montada = montarConstelaciones(contenedor.current, {
        alElegirFigura: slug => { setFigura(slug); setEstrella(null); },
        alElegirEstrella: setEstrella
      });
      escena.current = montada;
      const inicial = parametros.get("ver");
      if (inicial && CONSTELLATION_BY_SLUG[inicial]) montada.enfocar(inicial);
    });
    return () => { cancelado = true; montada?.desmontar(); escena.current = null; };
    // Solo al montar: los cambios posteriores de ?ver los provoca esta misma vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* La URL sigue a lo que se mira, con replace para no llenar el historial de
     pasos intermedios: volver atrás debe salir del mapa, no deshacer un zoom. */
  useEffect(() => {
    const actual = parametros.get("ver") ?? null;
    if (figura === actual) return;
    const siguientes = new URLSearchParams(parametros);
    if (figura) siguientes.set("ver", figura); else siguientes.delete("ver");
    setParametros(siguientes, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figura]);

  const elegir = slug => { escena.current?.enfocar(slug); };

  /* Con 88 botones, la figura activa suele quedar fuera de la parte visible de
     la lista: al llegar por enlace directo no se ve cuál está elegida. */
  const lista = useRef(null);
  useEffect(() => {
    if (!figura || !lista.current) return;
    lista.current.querySelector(".es-activa")?.scrollIntoView({ block: "nearest" });
  }, [figura]);
  const datos = figura ? CONSTELLATION_BY_SLUG[figura] : null;
  const datosEstrella = estrella ? KNOWN_STAR_BY_SLUG[estrella.punto.starSlug] : null;

  return (
    <div className="vista">
      <div ref={contenedor} className="vista__lienzo" />

      <section className="tarjeta-vista">
        <p className="eyebrow">Mapa estelar</p>
        <h1>Constelaciones</h1>
        <div className="lista-figuras" ref={lista}>
          <button
            type="button"
            className={`figura-btn${figura ? "" : " es-activa"}`}
            onClick={() => escena.current?.verTodo()}
          >
            <strong>Mapa completo</strong>
            <span>Esfera celeste, 88 figuras</span>
          </button>
          {CONSTELLATIONS.map(c => (
            <button
              key={c.slug}
              type="button"
              className={`figura-btn${figura === c.slug ? " es-activa" : ""}`}
              onClick={() => elegir(c.slug)}
            >
              <strong>{c.name}</strong>
              <span>Hemisferio {c.hemisphere}</span>
            </button>
          ))}
        </div>
        <div className="acciones-vista">
          <Link className="boton boton--suave" to="/">Volver al universo</Link>
          <Link className="boton boton--suave" to="/indice">Índice</Link>
          <button type="button" className="boton boton--suave" onClick={() => escena.current?.zoom(-10)}>+</button>
          <button type="button" className="boton boton--suave" onClick={() => escena.current?.zoom(10)}>−</button>
          <button type="button" className="boton" onClick={() => escena.current?.verTodo()}>Reset</button>
        </div>
      </section>

      {(datos || estrella) && (
        <aside className="ficha-flotante ficha-flotante--alta">
          <button
            type="button" className="ficha-flotante__cerrar"
            onClick={() => { setEstrella(null); escena.current?.verTodo(); }}
            aria-label="Cerrar"
          >×</button>

          {estrella ? (
            <>
              <p className="eyebrow">Estrella</p>
              <h2>{estrella.punto.name}</h2>
              <p>{datosEstrella?.description ?? estrella.punto.detail}</p>
              <dl className="datos datos--compactos">
                <div><dt>Constelación</dt><dd>{CONSTELLATION_BY_SLUG[estrella.figura]?.name}</dd></div>
                <div><dt>Magnitud</dt><dd>{estrella.punto.mag}</dd></div>
                <div><dt>Tipo</dt><dd>{estrella.punto.type}</dd></div>
                <div><dt>Distancia</dt><dd>{estrella.punto.distance}</dd></div>
              </dl>
              <div className="acciones-vista">
                <Link className="boton" to={`/estrellas/${estrella.punto.starSlug}`}>
                  Abrir ficha de {estrella.punto.name}
                </Link>
                <button type="button" className="boton boton--suave" onClick={() => setEstrella(null)}>
                  Volver a la figura
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Constelación</p>
              <h2>{datos.name}</h2>
              <p>{datos.description}</p>
              <dl className="datos datos--compactos">
                <div><dt>Hemisferio</dt><dd>{datos.hemisphere}</dd></div>
                <div><dt>Estrellas</dt><dd>{datos.points.length}</dd></div>
                <div><dt>Extensión</dt><dd>{datos.extensionGrados}°</dd></div>
                <div><dt>Nombre latino</dt><dd>{datos.latin}</dd></div>
              </dl>
              <Link className="boton" to={`/constelaciones/${datos.slug}`}>Abrir ficha de {datos.name}</Link>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
