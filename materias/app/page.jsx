import Link from "next/link";
import Bienvenida from "./bienvenida.jsx";
import { BANDAS } from "@explora/contenido/bandas.js";
import { MATERIAS, paginasDe, preguntasDe } from "../lib/contenido.js";

/* La portada de Explora, portada del index.html de la raíz.

   Lo que cambia respecto del original: las cifras ya no están escritas a mano en
   el HTML. «18 temas», «17 ejercicios», «6 niveles» eran literales que había que
   acordarse de actualizar al añadir contenido, y que envejecen en silencio: el
   índice del universo decía «207 fichas» mucho después de tener 415. Ahora salen
   de contar lo que hay.

   El enlace del Universo apunta a /universo/, que es donde lo montará nginx. En
   local, mientras esa regla no exista, ese enlace no lleva a ninguna parte: es lo
   correcto igualmente, porque el destino real no es un archivo de esta app. */

export const metadata = {
  title: "Explora — Lenguaje, Matemáticas y el Universo",
  description:
    "Tres materias para explorar: ortografía y gramática española, matemáticas por edad, y el universo en 3D."
};

/* Reparto de páginas por categoría, para la barra de segmentos de Lenguaje. Se
   ordena de mayor a menor porque la barra se lee de un vistazo y así el bloque
   dominante queda primero. */
function porCategoria(slug) {
  const cuenta = new Map();
  for (const pagina of paginasDe(slug)) {
    cuenta.set(pagina.categoria, (cuenta.get(pagina.categoria) ?? 0) + 1);
  }
  return [...cuenta].sort((a, b) => b[1] - a[1]);
}

export default function Portada() {
  const lenguaje = { paginas: paginasDe("lenguaje"), preguntas: preguntasDe("lenguaje") };
  const grupos = porCategoria("lenguaje");
  const matematicas = { paginas: paginasDe("matematicas"), preguntas: preguntasDe("matematicas") };
  const diagnosticos = matematicas.preguntas.filter(p => p.familia === "diagnostico");
  const primera = BANDAS[0], ultima = BANDAS[BANDAS.length - 1];

  return (
    <>
      <Bienvenida />
      <header className="masthead">
        <p className="wordmark">Atlas · ricardogatica.com</p>
        <h1 className="title">Explora</h1>
        <p className="lede">Elige una materia y empieza a descubrir.</p>
        <p className="territories">
          Tres territorios: <b className="is-lengua">las palabras</b>,{" "}
          <b className="is-mate">los números</b> y <b className="is-cielo">el cielo</b>.
        </p>
      </header>

      <main className="main">
        <h2 className="sr-only">Materias</h2>
        <ul className="plates">
          <li className="plates__item">
            <Link className="plate plate--lengua" href="/lenguaje/">
              <span className="plate__mark" aria-hidden="true">Á</span>
              <span className="plate__head">
                <span className="plate__kind">Materia</span>
                <h3 className="plate__name">Lenguaje</h3>
                <p className="plate__what">
                  Escribe sin dudar: tildes, puntuación, b y v, concordancia, conectores y
                  redacción clara.
                </p>
              </span>

              <span className="scale">
                <span className="scale__title">{lenguaje.paginas.length} temas, agrupados así</span>
                <span className="scale__bar" aria-hidden="true">
                  {grupos.map(([categoria, cuantas], i) => (
                    <i key={categoria} className={`seg seg--${"abcd"[Math.min(i, 3)]}`} style={{ flex: cuantas }} />
                  ))}
                </span>
                <span className="scale__keys">
                  {grupos.map(([categoria, cuantas]) => (
                    <b key={categoria}>{categoria} {cuantas}</b>
                  ))}
                </span>
                <span className="scale__note">
                  Con {lenguaje.preguntas.length} ejercicios para practicar
                </span>
              </span>

              <span className="plate__enter">Entrar a Lenguaje <i aria-hidden="true">→</i></span>
            </Link>
          </li>

          <li className="plates__item">
            <Link className="plate plate--mate" href="/matematicas/">
              <span className="plate__mark" aria-hidden="true">+</span>
              <span className="plate__head">
                <span className="plate__kind">Materia</span>
                <h3 className="plate__name">Matemáticas</h3>
                <p className="plate__what">
                  Números, geometría, álgebra y datos, ordenados por la edad de quien aprende.
                </p>
              </span>

              <span className="scale">
                <span className="scale__title">
                  {BANDAS.length} tramos, de {primera.desde} a {ultima.hasta} años
                </span>
                <span className="scale__ruler" aria-hidden="true">
                  {/* Una marca por tramo, colocada donde empieza dentro del recorrido
                      de edades: la regla dibuja las bandas reales, no seis marcas
                      repartidas a ojo. */}
                  {BANDAS.map(banda => (
                    <i
                      key={banda.id}
                      className="tick"
                      style={{
                        left: `${((banda.desde - primera.desde) / (ultima.hasta - primera.desde)) * 100}%`
                      }}
                    />
                  ))}
                </span>
                <span className="scale__ends" aria-hidden="true">
                  <b>{primera.desde} años</b><b>{ultima.hasta} años</b>
                </span>
                <span className="scale__note">
                  Con {diagnosticos.length} preguntas de diagnóstico para saber dónde empezar
                </span>
              </span>

              <span className="plate__enter">Entrar a Matemáticas <i aria-hidden="true">→</i></span>
            </Link>
          </li>

          <li className="plates__item">
            <a className="plate plate--cielo" href="/universo/">
              <span className="plate__mark" aria-hidden="true">✦</span>
              <span className="plate__head">
                <span className="plate__kind">Materia</span>
                <h3 className="plate__name">Universo y Sistema Solar</h3>
                <p className="plate__what">
                  Gira los planetas, viaja a las estrellas y recorre la historia desde el Big Bang.
                </p>
              </span>

              <span className="scale">
                <span className="scale__title">Hasta dónde llega el mapa</span>
                <span className="scale__ruler scale__ruler--log" aria-hidden="true">
                  <i className="tick" style={{ left: "0%" }} />
                  <i className="tick" style={{ left: "27.4%" }} />
                  <i className="tick" style={{ left: "100%" }} />
                </span>
                <span className="scale__ends" aria-hidden="true"><b>4,24 al</b><b>10.400 M al</b></span>
                {/* Estas cifras son del otro módulo y aquí son literales: contarlas
                    obligaría a que esta app importara el catálogo del cielo, y ese
                    acoplamiento no toca hasta que el universo sea su propia app. */}
                <span className="scale__note">
                  Escala logarítmica, de la estrella más cercana al objeto más lejano. Incluye
                  415 fichas: cuerpos del sistema solar, 316 estrellas con nombre propio y las
                  88 constelaciones.
                </span>
              </span>

              <span className="plate__enter">Entrar al Universo <i aria-hidden="true">→</i></span>
            </a>
          </li>
        </ul>

        <section className="guide">
          <h2 className="guide__title">Cómo usar este sitio</h2>
          <ol className="steps">
            <li className="step">
              <span className="step__num">1</span>
              <h3 className="step__name">Elige tu materia</h3>
              <p className="step__text">
                Entra por la tarjeta que te llame la atención. Siempre puedes volver aquí con el
                enlace «Explora» de cada materia.
              </p>
            </li>
            <li className="step">
              <span className="step__num">2</span>
              <h3 className="step__name">Sigue la ruta o busca</h3>
              <p className="step__text">
                Si acompañas a alguien, la <Link href="/ruta/">ruta de aprendizaje</Link> dice qué
                toca a cada edad. Si buscas una regla concreta, entra por su materia.
              </p>
            </li>
            <li className="step">
              <span className="step__num">3</span>
              <h3 className="step__name">Practica y comprueba</h3>
              <p className="step__text">
                Los ejercicios se corrigen solos y te dicen por qué. Equivocarse es parte de
                aprender: puedes reiniciar cuando quieras.
              </p>
            </li>
          </ol>
        </section>

        <section className="adults">
          <h2 className="adults__title">Para adultos y docentes</h2>
          <div className="adults__grid">
            <p className="adults__text">
              Las materias son de acceso libre: no piden cuenta, no guardan datos y no necesitan
              instalar nada. Todo funciona en el navegador.
            </p>
            <p className="adults__text">
              La ruta de aprendizaje cubre de los {primera.desde} a los {ultima.hasta} años en{" "}
              {BANDAS.length} tramos que no dejan huecos, e incluye {diagnosticos.length} preguntas
              de diagnóstico para elegir el punto de partida en lugar de suponerlo.
            </p>
            <p className="adults__text">
              Lenguaje cubre ortografía, gramática y redacción con ejemplos y contraejemplos,
              pensado para consultar una regla concreta cuando surge la duda.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
