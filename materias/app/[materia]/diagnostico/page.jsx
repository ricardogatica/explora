import Link from "next/link";
import Migas from "../../migas.jsx";
import {
  MATERIAS, materiaPorSlug, preguntasDeMateriaYBanda, tramosDeMateria
} from "../../../lib/contenido.js";

/* El diagnóstico dejó de ser uno solo por materia y pasó a estar dentro de cada
   edad: así se comprueba un tramo concreto en vez de recorrer los seis de una
   sentada, que eran treinta preguntas seguidas.

   Esta página no se borra porque su dirección ya existía. Se queda como puerta:
   dice de qué va y reparte por edad. */

export function generateStaticParams() {
  return MATERIAS.map(materia => ({ materia: materia.slug }));
}

export async function generateMetadata({ params }) {
  const { materia } = await params;
  return { title: `Diagnóstico de ${materiaPorSlug(materia).nombre} · Explora` };
}

export default async function Diagnostico({ params }) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);

  const tramos = tramosDeMateria(slug).map(banda => ({
    ...banda,
    cuantas: preguntasDeMateriaYBanda(slug, banda.id).filter(p => p.familia === "diagnostico").length
  }));
  const total = tramos.reduce((suma, tramo) => suma + tramo.cuantas, 0);

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre, href: `/${slug}/` }, { texto: "Diagnóstico" }]} />
      <p className="eyebrow">Para el adulto que acompaña</p>
      <h1>Diagnóstico de {materia.nombre}</h1>

      {total === 0 ? (
        <p className="subtitle">
          {materia.nombre} todavía no tiene preguntas de diagnóstico.
        </p>
      ) : (
        <>
          <p className="subtitle">
            El diagnóstico va por edad: elige el tramo que quieres comprobar. No es una prueba
            para el niño —muchas preguntas son observaciones que anota un adulto— y sirve para
            saber si un tramo está afianzado antes de seguir.
          </p>
          <div className="edades__lista">
            {tramos.filter(tramo => tramo.cuantas > 0).map(tramo => (
              <Link key={tramo.id} className="edad" href={`/${slug}/edad/${tramo.id}/diagnostico/`}>
                <strong>{tramo.titulo}</strong>
                <span>{tramo.etapa}</span>
                <span className="edad__cuenta">{tramo.cuantas} preguntas</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
