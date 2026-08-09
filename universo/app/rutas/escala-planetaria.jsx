import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { BODY_DATA } from "../../../sistema_solar/data.js";
import { RADIOS } from "../escenas/escala-planetaria.js";

export function meta() {
  return [
    { title: "Escala planetaria · Universo · Explora" },
    { name: "description", content: "Los planetas del sistema solar comparados por tamaño relativo." }
  ];
}

/* Vista de pantalla completa, no una ficha: la escena ocupa todo y los paneles
   flotan encima, como en el sitio anterior. El patrón que se fija aquí —escena
   en JavaScript llano que avisa por callback, HUD en React— es el que van a
   reutilizar la escala de soles, las constelaciones y el universo. */
export default function EscalaPlanetaria() {
  const contenedor = useRef(null);
  const escena = useRef(null);
  const [elegido, setElegido] = useState(null);

  useEffect(() => {
    let montada = null, cancelado = false;
    import("../escenas/escala-planetaria.js").then(({ montarEscalaPlanetaria }) => {
      if (cancelado || !contenedor.current) return;
      montada = montarEscalaPlanetaria(contenedor.current, { alElegir: setElegido });
      escena.current = montada;
    });
    return () => { cancelado = true; montada?.desmontar(); escena.current = null; };
  }, []);

  const cuerpo = elegido ? BODY_DATA[elegido] : null;

  return (
    <div className="vista">
      <div ref={contenedor} className="vista__lienzo" />

      <section className="tarjeta-vista">
        <p className="eyebrow">Vista comparativa</p>
        <h1>Sistema Solar a escala</h1>
        <p>
          Los planetas se muestran por tamaño relativo, en radios de la Tierra. La escena no
          representa distancias orbitales: el Sol queda parcialmente fuera de cuadro para
          conservar la comparación.
        </p>
        <p>
          La Luna no está en la fila, porque no es un planeta: orbita a la Tierra. Su tamaño sí
          está a escala —un cuarto del de la Tierra—, pero no su distancia.
        </p>
        <p>Haz click en un planeta o satélite para enfocarlo y ver su ficha.</p>
        <div className="acciones-vista">
          <Link className="boton boton--suave" to="/">Volver al universo</Link>
          <Link className="boton boton--suave" to="/escala-de-soles">Ver escala de soles</Link>
          <Link className="boton boton--suave" to="/indice">Índice</Link>
          <button type="button" className="boton" onClick={() => escena.current?.verGeneral()}>Reset</button>
        </div>
      </section>

      {cuerpo && (
        <aside className="ficha-flotante">
          <button type="button" className="ficha-flotante__cerrar" onClick={() => setElegido(null)} aria-label="Cerrar la ficha">×</button>
          <h2>{cuerpo.name}</h2>
          <p>{cuerpo.type}. Diámetro: {cuerpo.diameter}.</p>
          <dl className="datos datos--compactos">
            <div><dt>Tipo</dt><dd>{cuerpo.type}</dd></div>
            <div><dt>Diámetro</dt><dd>{cuerpo.diameter}</dd></div>
            <div>
              <dt>Radio comparado</dt>
              <dd>{elegido === "earth"
                ? "Es la unidad de la escala"
                : `${RADIOS[elegido].toLocaleString("es")} veces la Tierra`}</dd>
            </div>
            <div><dt>Satélites</dt><dd>{cuerpo.moons}</dd></div>
          </dl>
          <Link className="boton" to={`/cuerpos/${elegido}`}>Abrir ficha de {cuerpo.name}</Link>
        </aside>
      )}
    </div>
  );
}
