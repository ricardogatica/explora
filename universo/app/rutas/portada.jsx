import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { TIMELINE_EVENTS } from "../../cielo/data.js";
import { fichaDe } from "../datos/fichas.js";
import { rutaDeEntrada } from "../datos/rutas.js";
import { PARADAS } from "../datos/viaje.js";

export function meta() {
  return [
    { title: "Universo y Sistema Solar · Explora" },
    { name: "description", content: "El universo en 3D: planetas, estrellas, constelaciones y la historia desde el Big Bang." }
  ];
}

/* La vista del universo, con su línea temporal.

   La escena manda y esto refleja: `alCambiar` trae en qué etapa está, qué zoom
   tiene y qué cuerpo se ha elegido, y de ahí sale todo lo que se pinta. Es el
   mismo reparto de las otras tres vistas, y evita el problema de tener el mismo
   estado en dos sitios discrepando.

   Un detalle que estaba en el sitio anterior y hay que conservar: la tira de
   tarjetas esconde más de dos mil píxeles a la derecha, así que al avanzar por
   la línea temporal la tarjeta correspondiente hay que traerla a la vista o
   parece que no ha pasado nada. */
export default function Universo() {
  const contenedor = useRef(null);
  const escena = useRef(null);
  const tira = useRef(null);
  const [estado, setEstado] = useState({ etapa: TIMELINE_EVENTS.length - 1, zoom: 18, abierta: false, elegido: null, evento: TIMELINE_EVENTS.at(-1), progreso: TIMELINE_EVENTS.length - 1 });

  useEffect(() => {
    let montada = null, cancelado = false;
    import("../escenas/universo.js").then(({ montarUniverso }) => {
      if (cancelado || !contenedor.current) return;
      montada = montarUniverso(contenedor.current, { alCambiar: setEstado });
      escena.current = montada;
    });
    return () => { cancelado = true; montada?.desmontar(); escena.current = null; };
  }, []);

  /* ── El viaje ────────────────────────────────────────────────────────────

     `parada` es null cuando no hay viaje; si no, el índice de la que se está
     viendo. `pausado` detiene el reloj sin salirse.

     Mientras dura, la tarjeta del título y la línea temporal se esconden: el
     viaje es para mirar, y esas dos cosas son para trastear. */
  const [viaje, setViaje] = useState(null);   // { parada, pausado }
  const enViaje = viaje !== null;
  const parada = enViaje ? PARADAS[viaje.parada] : null;
  const deshacerParada = useRef(null);

  /* Cada parada le pide a la escena su encuadre. Si la escena devuelve algo —la
     comparación del ojo y el sensor devuelve cómo deshacerse—, se guarda para
     llamarlo al cambiar de parada. */
  useEffect(() => {
    if (!parada) return;
    deshacerParada.current?.();
    deshacerParada.current = escena.current?.[parada.hacer]?.() ?? null;
  }, [parada]);

  /* El reloj que pasa de parada en parada. Un temporizador por parada y no uno
     global: así pausar es no programar el siguiente, sin cuentas de tiempo
     restante que se desincronizan. */
  useEffect(() => {
    if (!enViaje || viaje.pausado || !parada) return;
    const id = setTimeout(() => {
      setViaje(actual => {
        if (actual === null) return null;
        const siguiente = actual.parada + 1;
        return siguiente < PARADAS.length ? { ...actual, parada: siguiente } : null;
      });
    }, parada.segundos * 1000);
    return () => clearTimeout(id);
  }, [enViaje, viaje?.parada, viaje?.pausado, parada]);

  /* Al salir, por el botón o al terminar, la escena vuelve a la normalidad. */
  useEffect(() => {
    if (enViaje) return;
    deshacerParada.current?.();
    deshacerParada.current = null;
    escena.current?.restablecerSensibilidad?.();
  }, [enViaje]);

  /* El giro lento de la cámara se para mientras dura el viaje: en un recorrido
     guiado, derivar es perder el encuadre que se acaba de elegir. */
  useEffect(() => {
    escena.current?.pausarGiroAutomatico?.(enViaje);
  }, [enViaje]);

  const empezarViaje = () => setViaje({ parada: 0, pausado: false });
  const salirDelViaje = () => setViaje(null);
  const irAParada = indice => setViaje(actual => actual && {
    ...actual,
    parada: Math.min(Math.max(indice, 0), PARADAS.length - 1)
  });

  useEffect(() => {
    const activa = tira.current?.querySelector(".etapa.es-activa");
    if (!activa || !tira.current) return;
    const centrada = activa.offsetLeft - (tira.current.clientWidth - activa.offsetWidth) / 2;
    tira.current.scrollTo({ left: Math.max(0, centrada), behavior: "smooth" });
  }, [estado.etapa]);

  const ficha = estado.elegido ? fichaDeCualquiera(estado.elegido) : null;

  return (
    <div className="vista">
      <div ref={contenedor} className="vista__lienzo" />

      {!enViaje && (
      <section className="tarjeta-vista tarjeta-vista--universo">
        <p className="eyebrow">Explorador 3D educativo</p>
        <h1>Universo, Tierra y Sistema Solar</h1>
        <p>
          La vista principal muestra la evolución desde el Big Bang, la formación del sistema
          solar, la historia de la Tierra y la transición de Pangea hacia los continentes actuales.
        </p>
        <div className="acciones-vista">
          <Link className="boton boton--suave" to="/escala-planetaria">Ver escala planetaria</Link>
          <Link className="boton boton--suave" to="/escala-de-soles">Ver escala de soles</Link>
          <Link className="boton boton--suave" to="/constelaciones">Ver constelaciones</Link>
          <Link className="boton boton--suave" to="/indice">Índice</Link>
          <button type="button" className="boton" onClick={() => escena.current?.enfocarTierra()}>Enfocar la Tierra</button>
          <button type="button" className="boton" onClick={() => escena.current?.enfocarSistemaSolar()}>Enfocar el sistema solar</button>
          <button type="button" className="boton" onClick={() => escena.current?.enfocarViaLactea()}>Enfocar la Vía Láctea</button>
        </div>
      </section>
      )}

      {/* Sobre la barra de zoom, como pidió quien lo va a usar. */}
      {!enViaje && (
        <button type="button" className="boton boton--viaje" onClick={empezarViaje}>
          Iniciar el viaje
        </button>
      )}

      <aside className="zoom">
        <span className="zoom__etiqueta">Zoom</span>
        <input
          type="range" min="0" max="100" value={estado.zoom}
          onChange={evento => escena.current?.ponerZoom(evento.target.value)}
          aria-label="Zoom de la escena"
        />
        <span className="zoom__valor">{estado.zoom}%</span>
      </aside>

      {estado.abierta && (
        <aside className="ficha-flotante ficha-flotante--universo">
          <button type="button" className="ficha-flotante__cerrar" onClick={() => escena.current?.cerrarFicha()} aria-label="Cerrar la ficha">×</button>
          {ficha ? (
            <>
              <h2>{ficha.titulo}</h2>
              <p>{ficha.tipo} · {estado.evento?.time}</p>
              <dl className="datos datos--compactos">
                {ficha.datos.slice(0, 6).map(([etiqueta, valor]) => (
                  <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor}</dd></div>
                ))}
              </dl>
              <Link className="boton" to={ficha.ruta}>Abrir ficha de {ficha.titulo}</Link>
            </>
          ) : (
            <>
              <p className="eyebrow">Evento cósmico</p>
              <h2>{estado.evento?.name}</h2>
              <p>{estado.evento?.desc}</p>
              <dl className="datos datos--compactos">
                <div><dt>Etapa</dt><dd>{estado.evento?.name}</dd></div>
                <div><dt>Tiempo</dt><dd>{estado.evento?.time}</dd></div>
              </dl>
            </>
          )}
        </aside>
      )}

      {enViaje && parada && (
        <section className="viaje" aria-live="polite">
          <div className="viaje__paradas" aria-hidden="true">
            {PARADAS.map((p, i) => (
              <i key={p.id} className={i <= viaje.parada ? "es-vista" : ""} />
            ))}
          </div>
          <p className="eyebrow">Parada {viaje.parada + 1} de {PARADAS.length}</p>
          <h2>{parada.titulo}</h2>
          <p className="viaje__texto">{parada.texto}</p>
          <div className="viaje__mandos">
            <button type="button" className="boton boton--suave" onClick={() => irAParada(viaje.parada - 1)} disabled={viaje.parada === 0}>‹ Anterior</button>
            <button type="button" className="boton" onClick={() => setViaje(a => a && { ...a, pausado: !a.pausado })}>
              {viaje.pausado ? "Continuar" : "Pausa"}
            </button>
            <button type="button" className="boton boton--suave" onClick={() => irAParada(viaje.parada + 1)} disabled={viaje.parada === PARADAS.length - 1}>Siguiente ›</button>
            <button type="button" className="boton boton--suave" onClick={salirDelViaje}>Salir del viaje</button>
          </div>
        </section>
      )}

      {!enViaje && (
      <section className="linea-temporal">
        <header className="linea-temporal__cabecera">
          <strong>Línea temporal del universo y la Tierra</strong>
          <span>Big Bang → expansión cósmica → sistema solar → Tierra → hoy</span>
        </header>
        <MapaCosmico etapa={estado.etapa} progreso={estado.progreso} />
        <input
          className="linea-temporal__barra"
          type="range" min="0" max={TIMELINE_EVENTS.length - 1} step="0.01"
          value={estado.progreso}
          onChange={evento => escena.current?.irAEtapa(Number(evento.target.value), { focusMode: "preserve", zoom: true })}
          aria-label="Recorrer la línea temporal"
        />
        <div className="marcas-temporales" aria-hidden="true">
          {TIMELINE_EVENTS.map((evento, indice) => (
            <span
              key={evento.id}
              className={indice === estado.etapa ? "es-activa" : ""}
              style={{ left: `${indice / (TIMELINE_EVENTS.length - 1) * 100}%` }}
              title={evento.name}
            />
          ))}
        </div>
        <div className="etapas" ref={tira}>
          {TIMELINE_EVENTS.map((evento, indice) => (
            <button
              key={evento.id}
              type="button"
              className={`etapa${indice === estado.etapa ? " es-activa" : ""}`}
              onClick={() => escena.current?.irAEtapa(indice, { focusMode: "event" })}
            >
              <span className="etapa__tiempo">{evento.time}</span>
              <strong>{evento.name}</strong>
              <span className="etapa__texto">{evento.desc}</span>
            </button>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}

/* El mapa cósmico: la franja que va del destello blanco del Big Bang al campo
   de estrellas de hoy, con las etapas mayores marcadas. Es una figura, no un
   control —de mover se encarga la barra de abajo— y no toca la escena 3D.

   Los puntos salen de aritmética sobre el índice, no de un generador aleatorio:
   así el cielo de la franja es siempre el mismo y no parpadea al redibujar. */
const PUNTOS = Array.from({ length: 70 }, (_, i) => ({
  x: 14 + (i * 37 % 83),
  y: 16 + (i * 53 % 58),
  lado: 2 + (i % 4 === 0 ? 2 : 0),
  opacidad: .28 + (i % 7) * .09
}));

const NOMBRES_DE_ETAPA = {
  "big-bang": "Big Bang", inflation: "Inflación", "cosmic-background": "Radiación de fondo",
  "dark-ages": "Edad oscura", "first-stars": "Primeras estrellas", "early-galaxies": "Galaxias",
  "solar-system-formation": "Sistema solar", "earth-formation": "Tierra", today: "Hoy"
};

function MapaCosmico({ etapa, progreso }) {
  const avance = progreso / (TIMELINE_EVENTS.length - 1) * 100;
  return (
    <div className="mapa-cosmico" aria-hidden="true">
      {/* El orden importa: los rótulos alternan arriba y abajo con :nth-child,
          y con los puntos por delante la paridad sale como en el sitio original. */}
      <div className="mapa-cosmico__avance" style={{ width: `${avance}%` }} />
      {PUNTOS.map((punto, i) => (
        <i
          key={i}
          className="mapa-cosmico__punto"
          style={{ left: `${punto.x}%`, top: `${punto.y}%`, width: punto.lado, height: punto.lado, opacity: punto.opacidad }}
        />
      ))}
      {TIMELINE_EVENTS.map((evento, indice) => NOMBRES_DE_ETAPA[evento.id] && (
        <div
          key={evento.id}
          className={`mapa-cosmico__etapa${indice === etapa ? " es-activa" : ""}`}
          style={{ left: `${indice / (TIMELINE_EVENTS.length - 1) * 100}%` }}
        >
          <span>{NOMBRES_DE_ETAPA[evento.id]}</span>
        </div>
      ))}
    </div>
  );
}

/* El slug puede ser de cualquiera de los cuatro grupos: la escena deja elegir un
   planeta, una estrella, una constelación o la galaxia sin distinguirlos. */
function fichaDeCualquiera(slug) {
  for (const grupo of ["solar", "stars", "constellations", "galaxies"]) {
    const ficha = fichaDe(grupo, slug);
    if (ficha) return { ...ficha, ruta: rutaDeEntrada(grupo, slug) };
  }
  return null;
}
