"use client";

import { useEffect, useRef, useState } from "react";
import { esCorrecta, puntaje, puntajeMaximo, comentario } from "@explora/contenido/corregir.js";
import { anotarRespuesta } from "./sesion.js";
import { consejoDeTanda } from "./consejo.js";

/* El visor de preguntas: uno para los cinco tipos y las dos materias.

   Sustituye a los dos app.js, que hacían casi lo mismo con 673 líneas de
   diferencia entre ellos. Con seis materias por delante, cada visor propio
   habría sido un dialecto más.

   La corrección no está aquí: vive en contenido/corregir.js, donde se puede
   probar. Este archivo solo pinta y recoge.

   Los dos tipos de arrastre admiten las dos formas. Pulsando —primero el
   elemento, después su sitio— porque es lo que funciona con el dedo, que es como
   lo va a usar un niño de seis años, y es lo que ya anunciaba la pista del
   contenido. Y arrastrando de verdad, porque el enunciado dice «arrastra cada
   objeto a su caja» y una interfaz que no deja hacer lo que pide su propio
   enunciado le está mintiendo a quien la lee. */

const nombreDeTipo = {
  "multiple-choice": "Elige una opción",
  fill: "Escribe la respuesta",
  observation: "Marca lo que observas",
  "drag-match": "Empareja cada elemento",
  "drag-order": "Ordena los elementos"
};

function Opciones({ pregunta, valor, elegir, bloqueado }) {
  return (
    <div className="opciones">
      {pregunta.opciones.map(opcion => {
        const elegida = valor === opcion;
        /* Con la pregunta ya revisada se marca la correcta aunque no sea la
           elegida: ver cuál era enseña más que saber que fallaste. En las
           observaciones no hay correcta, así que no se marca ninguna. */
        const correcta = bloqueado && pregunta.tipo !== "observation" && opcion === pregunta.respuesta;
        const fallada = bloqueado && elegida && !correcta && pregunta.tipo !== "observation";
        return (
          <button
            key={opcion}
            type="button"
            className={`opcion${elegida ? " es-elegida" : ""}${correcta ? " es-correcta" : ""}${fallada ? " es-fallada" : ""}`}
            onClick={() => !bloqueado && elegir(opcion)}
            aria-pressed={elegida}
            disabled={bloqueado}
          >
            {opcion}
          </button>
        );
      })}
    </div>
  );
}

function Completar({ valor, elegir, bloqueado }) {
  return (
    <input
      className="completar"
      value={valor ?? ""}
      onChange={evento => elegir(evento.target.value)}
      placeholder="Escribe la respuesta"
      disabled={bloqueado}
      autoComplete="off"
      spellCheck="false"
    />
  );
}

function Emparejar({ pregunta, valor, elegir, bloqueado }) {
  const [tomado, setTomado] = useState(null);
  const puestos = valor ?? {};
  const sueltos = pregunta.elementos.filter(elemento => !(elemento.id in puestos));

  const colocar = destino => {
    if (bloqueado || !tomado) return;
    elegir({ ...puestos, [tomado]: destino });
    setTomado(null);
  };
  const sacar = id => {
    if (bloqueado) return;
    const resto = { ...puestos };
    delete resto[id];
    elegir(resto);
  };

  return (
    <div className="arrastre">
      <div className="banco" aria-label="Elementos por colocar">
        {sueltos.map(elemento => (
          <button
            key={elemento.id}
            type="button"
            className={`ficha${tomado === elemento.id ? " es-tomada" : ""}`}
            onClick={() => !bloqueado && setTomado(tomado === elemento.id ? null : elemento.id)}
            draggable={!bloqueado}
            onDragStart={() => setTomado(elemento.id)}
            disabled={bloqueado}
          >
            {elemento.etiqueta}
          </button>
        ))}
        {sueltos.length === 0 && <p className="banco__vacio">Todos colocados</p>}
      </div>

      <div className="destinos">
        {pregunta.destinos.map(destino => {
          const dentro = pregunta.elementos.filter(e => puestos[e.id] === destino.id);
          return (
            <div
              key={destino.id}
              className={`destino${tomado ? " es-disponible" : ""}`}
              onClick={() => colocar(destino.id)}
              onDragOver={evento => evento.preventDefault()}
              onDrop={evento => { evento.preventDefault(); colocar(destino.id); }}
              role="button"
              tabIndex={0}
              onKeyDown={evento => evento.key === "Enter" && colocar(destino.id)}
            >
              <span className="destino__nombre">{destino.etiqueta}</span>
              <div className="destino__caja">
                {dentro.length === 0
                  ? <span className="destino__hueco">{tomado ? "Pulsa aquí" : "Vacío"}</span>
                  : dentro.map(elemento => (
                      <button
                        key={elemento.id}
                        type="button"
                        className="ficha ficha--puesta"
                        onClick={evento => { evento.stopPropagation(); sacar(elemento.id); }}
                        disabled={bloqueado}
                      >
                        {elemento.etiqueta}
                      </button>
                    ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ordenar({ pregunta, valor, elegir, bloqueado }) {
  const [tomado, setTomado] = useState(null);
  const huecos = valor ?? pregunta.elementos.map(() => null);
  const sueltos = pregunta.elementos.filter(elemento => !huecos.includes(elemento.id));

  const colocar = posicion => {
    if (bloqueado || !tomado) return;
    const siguiente = huecos.map(id => (id === tomado ? null : id));
    siguiente[posicion] = tomado;
    elegir(siguiente);
    setTomado(null);
  };
  const etiquetaDe = id => pregunta.elementos.find(e => e.id === id)?.etiqueta ?? "";

  return (
    <div className="arrastre">
      <div className="banco" aria-label="Elementos por ordenar">
        {sueltos.map(elemento => (
          <button
            key={elemento.id}
            type="button"
            className={`ficha${tomado === elemento.id ? " es-tomada" : ""}`}
            onClick={() => !bloqueado && setTomado(tomado === elemento.id ? null : elemento.id)}
            draggable={!bloqueado}
            onDragStart={() => setTomado(elemento.id)}
            disabled={bloqueado}
          >
            {elemento.etiqueta}
          </button>
        ))}
        {sueltos.length === 0 && <p className="banco__vacio">Todos colocados</p>}
      </div>

      <div className="destinos destinos--fila">
        {huecos.map((id, posicion) => (
          <div
            key={posicion}
            className={`destino${tomado ? " es-disponible" : ""}`}
            onClick={() => (id ? !bloqueado && elegir(huecos.map((x, i) => (i === posicion ? null : x))) : colocar(posicion))}
            onDragOver={evento => evento.preventDefault()}
            onDrop={evento => { evento.preventDefault(); colocar(posicion); }}
            role="button"
            tabIndex={0}
            onKeyDown={evento => evento.key === "Enter" && colocar(posicion)}
          >
            <span className="destino__nombre">{posicion + 1}</span>
            <div className="destino__caja">
              {id
                ? <span className="ficha ficha--puesta">{etiquetaDe(id)}</span>
                : <span className="destino__hueco">{tomado ? "Pulsa aquí" : "Vacío"}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CUERPOS = {
  "multiple-choice": Opciones,
  observation: Opciones,
  fill: Completar,
  "drag-match": Emparejar,
  "drag-order": Ordenar
};

/* La puerta de atrás: qué repasar cuando esto no sale.

   Va abierta o cerrada, pero siempre está. Es la diferencia entre «lo he fallado y
   me quedo igual» y «lo he fallado y sé por dónde volver», que es lo que convierte
   un ejercicio en algo que enseña.

   El enlace es un enlace de verdad y no un panel que explica aquí mismo: repasar es
   leer una página entera, no un párrafo de consuelo. Se abre en la misma pestaña
   porque volver es el botón de atrás, que todo el mundo sabe usar. */
function Repaso({ repaso, abierto, alternar }) {
  const explica = repaso?.explica;
  const antes = repaso?.antes ?? [];
  if (!explica && !antes.length) return null;

  return (
    <div className={`repaso${abierto ? " es-abierto" : ""}`}>
      <button type="button" className="repaso__llave" onClick={alternar} aria-expanded={abierto}>
        ¿Se te hace difícil? <span aria-hidden="true">{abierto ? "▴" : "▾"}</span>
      </button>
      {abierto && (
        <div className="repaso__cuerpo">
          {explica && (
            <p className="repaso__intro">
              Esta pregunta sale de <a href={explica.ruta}><b>{explica.titulo}</b></a>.
            </p>
          )}
          {antes.length > 0 && (
            <>
              <p className="repaso__intro">Y antes de esto va:</p>
              <ul className="repaso__lista">
                {antes.map(pagina => (
                  <li key={pagina.ruta}><a href={pagina.ruta}>{pagina.titulo}</a></li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* Lo que se dice al terminar.

   Es la otra mitad de lo que pidió quien lo va a usar: una duda suelta se resuelve
   con la lección de la pregunta, pero equivocarse mucho no es una duda, es que el
   tramo no está afianzado. Eso no se ve pregunta a pregunta —se ve al final— y la
   respuesta tampoco es una página: es volver una edad atrás entera.

   El umbral es la mitad. Por debajo se propone retroceder; por encima del 85 % en un
   diagnóstico, seguir. En medio no se dice nada, porque no hay nada seguro que
   decir y un consejo dudoso es peor que ninguno. */
function Veredicto({ puntos, maximo, tramo }) {
  /* Los umbrales viven en consejo.js, donde se pueden probar: mandar a alguien
     hacia atrás sin motivo, o dejarlo atascado sin avisar, son las dos formas de
     equivocarse aquí. */
  const consejo = consejoDeTanda(puntos, maximo, tramo);
  if (!consejo) return null;
  const proporcion = consejo.proporcion;

  if (consejo.tipo === "atras") {
    return (
      <div className="cierre cierre--atras">
        <strong>Este tramo se está atragantando</strong>
        <p>
          Menos de la mitad. No pasa nada y no hay que insistir aquí: casi siempre falta
          algo de antes. Vuelve a {tramo.anterior.titulo} y prueba otra vez.
        </p>
        <p className="acciones">
          <a className="boton" href={tramo.anterior.ruta}>Ir a {tramo.anterior.titulo}</a>
          {tramo.anterior.rutaDeLoMismo && (
            <a className="boton boton--suave" href={tramo.anterior.rutaDeLoMismo}>
              {tramo.esDiagnostico ? "Su diagnóstico" : "Sus ejercicios"}
            </a>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="cierre cierre--adelante">
      <strong>Este tramo está afianzado</strong>
      <p>
        {Math.round(proporcion * 100)} de cada 100. Se puede seguir con{" "}
        {tramo.siguiente.titulo}.
      </p>
      <p className="acciones">
        <a className="boton" href={tramo.siguiente.ruta}>Ir a {tramo.siguiente.titulo}</a>
      </p>
    </div>
  );
}

export default function Practica({ preguntas, tramo }) {
  const [indice, setIndice] = useState(0);
  const [valor, setValor] = useState(null);
  const [revisada, setRevisada] = useState(false);
  const [resultados, setResultados] = useState([]);

  /* El repaso se abre solo a partir del segundo fallo de la tanda. Al primero no:
     una equivocación suelta no es atascarse, y saltar con ayuda a la primera trata
     de torpe a quien va bien. */
  const [repasoAbierto, setRepasoAbierto] = useState(false);
  const fallos = resultados.filter(r => r.fallada).length;

  /* Cuánto se tarda en responder. Es el dato que distingue «esta pregunta la
     falla todo el mundo» de «esta pregunta nadie la entiende»: fallar en tres
     segundos y fallar en dos minutos no son el mismo problema. */
  const mostradaEn = useRef(Date.now());
  useEffect(() => { mostradaEn.current = Date.now(); }, [indice]);

  if (preguntas.length === 0) return null;

  const terminado = indice >= preguntas.length;
  if (terminado) {
    const puntos = resultados.reduce((suma, r) => suma + r.puntos, 0);
    const maximo = resultados.reduce((suma, r) => suma + r.maximo, 0);
    return (
      <section className="practica">
        <h2 className="practica__fin">Has terminado</h2>
        <p className="subtitle">
          {puntos} de {maximo} puntos en {resultados.length} preguntas.
          {" "}Equivocarse es parte de aprender: puedes repetir cuando quieras.
        </p>
        <Veredicto puntos={puntos} maximo={maximo} tramo={tramo} />
        <button
          type="button"
          className="boton"
          onClick={() => { setIndice(0); setValor(null); setRevisada(false); setResultados([]); setRepasoAbierto(false); }}
        >
          Empezar de nuevo
        </button>
      </section>
    );
  }

  const pregunta = preguntas[indice];
  const Cuerpo = CUERPOS[pregunta.tipo];
  const respondida = valor !== null && valor !== "" && !(typeof valor === "object" && Object.keys(valor).length === 0);
  const acierto = revisada ? esCorrecta(pregunta, valor) : null;

  const revisar = () => {
    setRevisada(true);
    const acertada = esCorrecta(pregunta, valor);
    setResultados([...resultados, {
      id: pregunta.id, puntos: puntaje(pregunta, valor), maximo: puntajeMaximo(pregunta),
      // Las observaciones no aciertan ni fallan: no cuentan para ofrecer ayuda.
      fallada: acertada === false
    }]);
    if (acertada === false && fallos >= 1) setRepasoAbierto(true);

    /* La pregunta ya trae de qué materia y banda es, así que no hay que
       pasárselo a este componente por otro sitio: un segundo camino para el
       mismo dato es un segundo camino para que discrepen.

       Solo se guarda lo tecleado en las de escribir. En las demás el «valor»
       es una opción o un mapa de emparejamientos, y eso ya lo dice el id de la
       pregunta junto con si acertó. */
    anotarRespuesta({
      materia: pregunta.materia,
      banda: pregunta.banda,
      familia: pregunta.familia,
      pregunta: pregunta.id,
      correcta: esCorrecta(pregunta, valor),
      escrito: pregunta.tipo === "fill" && typeof valor === "string" ? valor : null,
      ms: Date.now() - mostradaEn.current
    });
  };
  const siguiente = () => { setIndice(indice + 1); setValor(null); setRevisada(false); setRepasoAbierto(false); };

  return (
    <section className="practica">
      <header className="practica__cabecera">
        <span className="practica__cuenta">Pregunta {indice + 1} de {preguntas.length}</span>
        <span className="practica__barra" aria-hidden="true">
          <i style={{ width: `${(indice / preguntas.length) * 100}%` }} />
        </span>
      </header>

      <p className="practica__tipo">{nombreDeTipo[pregunta.tipo]}</p>
      <p className="practica__enunciado">{pregunta.pregunta}</p>
      {pregunta.pista && !revisada && <p className="practica__pista">{pregunta.pista}</p>}

      <Cuerpo pregunta={pregunta} valor={valor} elegir={setValor} bloqueado={revisada} />

      {revisada && (
        /* Las observaciones no aciertan ni fallan: se anotan. Pintarlas de rojo
           sería decirle a un niño de tres años que ha fallado algo que no era
           una prueba. */
        <div className={`veredicto${acierto === null ? " es-anotado" : acierto ? " es-bien" : " es-mal"}`}>
          <strong>
            {acierto === null ? "Anotado" : acierto ? "Correcto" : "No es esa"}
          </strong>
          {comentario(pregunta) && <p>{comentario(pregunta)}</p>}
        </div>
      )}

      <Repaso
        repaso={pregunta.repaso}
        abierto={repasoAbierto}
        alternar={() => setRepasoAbierto(!repasoAbierto)}
      />

      <div className="practica__acciones">
        {!revisada
          ? <button type="button" className="boton" onClick={revisar} disabled={!respondida}>Revisar</button>
          : <button type="button" className="boton" onClick={siguiente}>
              {indice + 1 === preguntas.length ? "Ver resultado" : "Siguiente"}
            </button>}
      </div>
    </section>
  );
}
