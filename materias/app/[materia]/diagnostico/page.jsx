import Migas from "../../migas.jsx";
import Practica from "../../practica.jsx";
import { MATERIAS, materiaPorSlug, preguntasDe } from "../../../lib/contenido.js";
import { BANDAS, bandaPorId } from "@explora/contenido/bandas.js";

/* El diagnóstico existe para responder una pregunta concreta de quien acompaña:
   por dónde empezar. No es una prueba para el niño —muchas preguntas son
   observaciones que anota un adulto— y por eso está separado de «practicar»:
   mezclarlos convertiría un rato de ejercicios en una evaluación sin avisar. */

export function generateStaticParams() {
  return MATERIAS.filter(materia =>
    preguntasDe(materia.slug).some(p => p.familia === "diagnostico")
  ).map(materia => ({ materia: materia.slug }));
}

export async function generateMetadata({ params }) {
  const { materia } = await params;
  return { title: `Diagnóstico de ${materiaPorSlug(materia).nombre} · Explora` };
}

export default async function Diagnostico({ params }) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);
  const preguntas = preguntasDe(slug).filter(p => p.familia === "diagnostico");

  /* En el orden de la ruta, de la banda más temprana a la más tardía: así se
     avanza hasta donde el niño deja de responder, que es justo el punto que se
     está buscando. */
  const orden = [...BANDAS.map(b => b.id), "previo"];
  const ordenadas = [...preguntas].sort((a, b) => {
    const posicion = id => (id === "previo" ? -1 : orden.indexOf(id));
    return posicion(a.banda) - posicion(b.banda);
  });

  const tramos = [...new Set(ordenadas.map(p => p.banda))]
    .map(id => bandaPorId(id)?.titulo)
    .filter(Boolean);

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre, href: `/${slug}/` }, { texto: "Diagnóstico" }]} />
      <p className="eyebrow">Para el adulto que acompaña</p>
      <h1>Diagnóstico de {materia.nombre}</h1>
      <p className="subtitle">
        {preguntas.length} preguntas ordenadas de menor a mayor edad, para elegir el punto de
        partida en lugar de suponerlo. Algunas son observaciones: no tienen respuesta correcta,
        se anota lo que se ve. Cubre {tramos.length} tramos, desde {tramos[0]}.
      </p>
      <Practica preguntas={ordenadas} />
    </main>
  );
}
