import Link from "next/link";
import Migas from "../../../../migas.jsx";
import Practica from "../../../../practica.jsx";
import {
  MATERIAS, materiaPorSlug, preguntasDeMateriaYBanda, repasoDePregunta, tramoAnteriorDeMateria, tramosDeMateria
} from "../../../../../lib/contenido.js";
import { BANDAS, bandaPorId } from "@explora/contenido/bandas.js";

/* Practicar una materia a una edad.

   La diferencia con /materia/practicar/ no es solo el filtro: aquí cada pregunta
   lleva consigo a dónde volver si se atasca. Ese cálculo se hace en el build —qué
   página repasar es cosa del contenido, y el contenido solo existe entero
   aquí— y viaja con la pregunta. */

export function generateStaticParams() {
  return MATERIAS.flatMap(materia =>
    tramosDeMateria(materia.slug).map(banda => ({ materia: materia.slug, banda: banda.id }))
  );
}

export async function generateMetadata({ params }) {
  const { materia, banda } = await params;
  return { title: `Practicar ${materiaPorSlug(materia).nombre} de ${bandaPorId(banda).titulo} · Explora` };
}

export default async function PracticarPorEdad({ params }) {
  const { materia: slug, banda: id } = await params;
  const materia = materiaPorSlug(slug);
  const tramo = bandaPorId(id);
  const anterior = tramoAnteriorDeMateria(slug, id);

  /* Solo la práctica: los diagnósticos los responde un adulto observando, y
     mezclarlos convertiría un rato de ejercicios en una evaluación sin avisar. */
  const preguntas = preguntasDeMateriaYBanda(slug, id)
    .filter(pregunta => pregunta.familia === "practica")
    .map(pregunta => ({
      ...pregunta,
      repaso: repasoDePregunta(pregunta).map(pagina => ({
        titulo: pagina.titulo, ruta: `/${slug}/${pagina.id}/`
      }))
    }));

  return (
    <main className="pagina">
      <Migas tramos={[
        { texto: materia.nombre, href: `/${slug}/` },
        { texto: tramo.titulo, href: `/${slug}/edad/${id}/` },
        { texto: "Practicar" }
      ]} />
      <p className="eyebrow">Ejercicios · {tramo.titulo}</p>
      <h1>Practicar {materia.nombre}</h1>
      <p className="subtitle">
        {preguntas.length > 0
          ? `${preguntas.length} ejercicios de ${tramo.titulo}, que se corrigen solos y explican por qué.`
          : `Todavía no hay ejercicios de ${materia.nombre.toLowerCase()} para esta edad.`}
      </p>

      {preguntas.length > 0 ? (
        <Practica preguntas={preguntas} />
      ) : (
        <p className="acciones">
          <Link className="boton boton--suave" href={`/${slug}/edad/${id}/`}>Ver los temas de esta edad</Link>
          {anterior && (
            <Link className="boton boton--suave" href={`/${slug}/edad/${anterior.id}/practicar/`}>
              Practicar {tramo.titulo === anterior.titulo ? "" : anterior.titulo}
            </Link>
          )}
        </p>
      )}
    </main>
  );
}
