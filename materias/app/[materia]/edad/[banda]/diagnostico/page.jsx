import Link from "next/link";
import Migas from "../../../../migas.jsx";
import Practica from "../../../../practica.jsx";
import {
  MATERIAS, materiaPorSlug, preguntasDeMateriaYBanda, tramosDeMateria, tramoAnteriorDeMateria
} from "../../../../../lib/contenido.js";
import { bandaPorId } from "@explora/contenido/bandas.js";

/* El diagnóstico de una materia a una edad.

   Antes había uno solo por materia, que recorría todos los tramos de golpe: treinta
   preguntas de los 3 a los 17 años seguidas. Servía para lo que fue pensado —buscar
   por dónde empezar cuando no se sabe— pero no para lo que se pide más a menudo:
   comprobar si un tramo concreto está afianzado.

   Sigue sin ser una prueba para el niño. Muchas preguntas son observaciones que
   anota un adulto: no tienen respuesta correcta y no se corrigen. Por eso está
   separado de «practicar», y por eso el encabezado lo dice antes de empezar. */

export function generateStaticParams() {
  return MATERIAS.flatMap(materia =>
    tramosDeMateria(materia.slug).map(banda => ({ materia: materia.slug, banda: banda.id }))
  );
}

export async function generateMetadata({ params }) {
  const { materia, banda } = await params;
  return { title: `Diagnóstico de ${materiaPorSlug(materia).nombre} · ${bandaPorId(banda).titulo} · Explora` };
}

export default async function DiagnosticoPorEdad({ params }) {
  const { materia: slug, banda: id } = await params;
  const materia = materiaPorSlug(slug);
  const tramo = bandaPorId(id);
  const anterior = tramoAnteriorDeMateria(slug, id);

  const preguntas = preguntasDeMateriaYBanda(slug, id).filter(p => p.familia === "diagnostico");
  const observaciones = preguntas.filter(p => p.tipo === "observation").length;

  return (
    <main className="pagina">
      <Migas tramos={[
        { texto: materia.nombre, href: `/${slug}/` },
        { texto: tramo.titulo, href: `/${slug}/edad/${id}/` },
        { texto: "Diagnóstico" }
      ]} />
      <p className="eyebrow">Para el adulto que acompaña · {tramo.titulo}</p>
      <h1>Diagnóstico de {materia.nombre}</h1>

      {preguntas.length > 0 ? (
        <>
          <p className="subtitle">
            {preguntas.length} preguntas de {tramo.titulo} para saber si este tramo está
            afianzado.
            {observaciones > 0 && (
              <> {observaciones === preguntas.length ? "Todas" : `${observaciones} de ellas`} son
              observaciones: no tienen respuesta correcta, se anota lo que se ve.</>
            )}
          </p>
          <Practica preguntas={preguntas} />
          {anterior && (
            <p className="acciones acciones--sueltas">
              <Link className="boton boton--suave" href={`/${slug}/edad/${anterior.id}/diagnostico/`}>
                ‹ Diagnóstico de {anterior.titulo}
              </Link>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="subtitle">
            Todavía no hay diagnóstico de {materia.nombre.toLowerCase()} para esta edad.
          </p>
          <p className="acciones">
            <Link className="boton boton--suave" href={`/${slug}/edad/${id}/`}>
              Ver los temas de {tramo.titulo}
            </Link>
            {anterior && (
              <Link className="boton boton--suave" href={`/${slug}/edad/${anterior.id}/diagnostico/`}>
                Diagnóstico de {anterior.titulo}
              </Link>
            )}
          </p>
        </>
      )}
    </main>
  );
}
