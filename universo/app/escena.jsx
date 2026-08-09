"use client";

import { useEffect, useRef, useState } from "react";

/* La escena 3D de una ficha, debajo de su descripción.

   Three.js se carga con un import dinámico dentro del efecto y no arriba del
   archivo: así el prerenderizado —que corre en Node, sin DOM ni WebGL— no
   necesita evaluarlo, y las fichas que nadie mira en 3D no descargan la
   biblioteca.

   Lo que devuelve el efecto es el desmontaje, y no es opcional: sin él, cada
   ficha por la que se navega deja su escena en la memoria de la tarjeta
   gráfica. Medido en la fase 3: 24 navegaciones sin desmontar dan nueve avisos
   de «Too many active WebGL contexts» y el canvas se queda en negro. */
export default function Escena({ objeto, cuerpo, alto = 420 }) {
  const contenedor = useRef(null);
  const [estado, setEstado] = useState("cargando");
  /* A pantalla completa se ve como en la versión anterior del sitio, que era
     una vista inmersiva de ventana entera. Incrustada en la ficha se lee mejor
     junto a los datos; a pantalla completa se mira. Las dos cosas sirven, así
     que están las dos. */
  const [completa, setCompleta] = useState(false);

  useEffect(() => {
    let desmontar = null, cancelado = false;

    /* Dos escenas distintas: los cuerpos del sistema solar traen lunas,
       anillos y texturas fotográficas; las estrellas y galaxias, su propio
       renderizador. Se carga solo la que hace falta. */
    const cargar = cuerpo
      ? import("./escenas/cuerpo.js").then(m => contenedor.current && m.montarCuerpo(contenedor.current, cuerpo))
      : import("./escenas/objeto-celeste.js").then(m => contenedor.current && m.montarObjetoCeleste(contenedor.current, objeto));

    cargar
      .then(soltar => {
        if (cancelado) { soltar?.(); return; }
        desmontar = soltar;
        setEstado("listo");
      })
      .catch(error => {
        console.error("No se pudo montar la escena", error);
        setEstado("error");
      });

    return () => { cancelado = true; desmontar?.(); };
  }, [objeto, cuerpo]);

  /* Salir con Escape: en pantalla completa no hay más interfaz que la escena, y
     buscar el botón con el ratón es justo lo que no se quiere hacer ahí. */
  useEffect(() => {
    if (!completa) return;
    const alPulsar = evento => { if (evento.key === "Escape") setCompleta(false); };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [completa]);

  return (
    <div
      className={`escena${completa ? " escena--completa" : ""}`}
      style={completa ? undefined : { height: alto }}
    >
      <div ref={contenedor} className="escena__lienzo" />
      {estado === "cargando" && <p className="escena__aviso">Cargando la escena…</p>}
      {estado === "error" && <p className="escena__aviso">No se pudo cargar la vista 3D.</p>}
      {estado === "listo" && (
        <>
          <p className="escena__ayuda">Arrastra para girar{completa ? " · Escape para salir" : ""}</p>
          <button
            type="button" className="escena__completa"
            onClick={() => setCompleta(!completa)}
            aria-pressed={completa}
          >
            {completa ? "Salir" : "Pantalla completa"}
          </button>
        </>
      )}
    </div>
  );
}
