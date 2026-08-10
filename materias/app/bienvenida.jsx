"use client";

import { useEffect, useRef, useState } from "react";
import { MODO_LOCAL, elegirModo, modoElegido } from "./sesion.js";

/* El modal de bienvenida: dónde se guarda el progreso.

   Sale una vez, en la portada, y solo si no hay modo elegido. Se puede cerrar
   sin elegir: es un sitio para aprender y no voy a poner una decisión de
   almacenamiento delante del contenido. Quien lo cierre puede leerlo todo; lo
   único que no ocurre es guardar nada. La próxima visita vuelve a preguntar.

   No se pinta en el servidor. Estas páginas se generan como archivos durante el
   build, cuando no existe navegador y por tanto no se sabe si alguien ya
   eligió; pintarlo ahí saldría en el HTML de todo el mundo y parpadearía al
   hidratar para quien ya había respondido. Por eso espera a estar montado. */
export default function Bienvenida() {
  const [visible, setVisible] = useState(false);
  const dialogo = useRef(null);
  const focoPrevio = useRef(null);

  useEffect(() => {
    if (modoElegido() === null) setVisible(true);
  }, []);

  /* Mientras está abierto se queda con el teclado: Escape cierra y el tabulador
     no se escapa a la página de detrás, que es lo que hace que un modal sea un
     modal para quien no usa ratón. */
  useEffect(() => {
    if (!visible) return;
    focoPrevio.current = document.activeElement;
    dialogo.current?.querySelector("button:not([disabled])")?.focus();

    const alPulsarTecla = evento => {
      if (evento.key === "Escape") { cerrar(); return; }
      if (evento.key !== "Tab") return;
      const focables = dialogo.current?.querySelectorAll("button:not([disabled]), [href]");
      if (!focables?.length) return;
      const primero = focables[0], ultimo = focables[focables.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault(); ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault(); primero.focus();
      }
    };

    document.addEventListener("keydown", alPulsarTecla);
    return () => document.removeEventListener("keydown", alPulsarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function cerrar() {
    setVisible(false);
    // El foco vuelve de donde salió, o se pierde en el limbo del documento.
    focoPrevio.current?.focus?.();
  }

  function usarDatosLocales() {
    elegirModo(MODO_LOCAL);
    cerrar();
  }

  if (!visible) return null;

  return (
    <div className="bienvenida" role="presentation" onMouseDown={evento => {
      // Pulsar fuera cierra, como en cualquier modal. Con mousedown y
      // comparando el destino para que arrastrar desde dentro no lo cierre.
      if (evento.target === evento.currentTarget) cerrar();
    }}>
      <div
        className="bienvenida__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-titulo"
        aria-describedby="bienvenida-texto"
        ref={dialogo}
      >
        <button type="button" className="bienvenida__cerrar" onClick={cerrar} aria-label="Cerrar">×</button>

        <p className="eyebrow">Explora</p>
        <h2 id="bienvenida-titulo">Bienvenida/o a Explora</h2>
        <p id="bienvenida-texto">
          Una base de conocimiento interactivo para aprender explorando: lenguaje, matemáticas
          y el universo en 3D, ordenados por edad de los 5 a los 17 años.
        </p>

        <h3 className="bienvenida__pregunta">¿Cómo quieres guardar tu progreso?</h3>

        <div className="bienvenida__opciones">
          <button type="button" className="bienvenida__opcion" onClick={usarDatosLocales}>
            <strong>Usar datos locales</strong>
            <span>
              Tu progreso se guarda en este navegador. No pedimos nombre ni correo. Si cambias de
              dispositivo o borras los datos del navegador, se pierde y no se puede recuperar.
            </span>
          </button>

          <button type="button" className="bienvenida__opcion es-pronto" disabled>
            <strong>Crear cuenta <span className="bienvenida__pronto">pronto</span></strong>
            <span>
              Todavía no está disponible. Cuando lo esté, el progreso te seguirá de un
              dispositivo a otro.
            </span>
          </button>
        </div>

        {/* Dicho aquí y no en una política que nadie abre: es una web para
            niños y lo que se guarda tiene que caber en dos líneas honestas. */}
        <p className="bienvenida__nota">
          Con los datos locales también guardamos, de forma anónima, qué preguntas se aciertan y
          cuáles no. Nos sirve para mejorar el contenido. Nunca sabemos quién eres.
        </p>
      </div>
    </div>
  );
}
