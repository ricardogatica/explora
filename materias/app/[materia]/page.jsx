import Link from "next/link";
import Migas from "../migas.jsx";
import Buscador from "../buscador.jsx";
import { MATERIAS, materiaPorSlug, paginasDe, preguntasDe, paginasDeMateriaYBanda, preguntasDeMateriaYBanda } from "../../lib/contenido.js";
import { BANDAS } from "@explora/contenido/bandas.js";

export function generateStaticParams() {
  return MATERIAS.map(materia => ({ materia: materia.slug }));
}

export async function generateMetadata({ params }) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);
  return { title: `${materia.nombre} · Explora`, description: materia.descripcion };
}

export default async function Materia({ params }) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);
  const paginas = paginasDe(slug);
  const preguntas = preguntasDe(slug);

  /* Los tramos con su recuento: uno vacío se dice, no se esconde. Un botón que
     lleva a una página en blanco gasta más confianza que una etiqueta que avisa. */
  const tramos = BANDAS.map(banda => ({
    ...banda,
    temas: paginasDeMateriaYBanda(slug, banda.id).length,
    ejercicios: preguntasDeMateriaYBanda(slug, banda.id).filter(p => p.familia === "practica").length
  }));

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre }]} />
      <p className="eyebrow">Materia</p>
      <h1>{materia.nombre}</h1>
      <p className="subtitle">
        {materia.descripcion} {paginas.length} páginas y {preguntas.length} preguntas.
      </p>

      {/* Por edad primero: es como se entra cuando se acompaña a alguien concreto.
          Lo de abajo —el buscador con todos los temas— es para quien viene a
          consultar una regla suelta, que es el otro uso y no el principal. */}
      <section className="edades">
        <h2 className="edades__titulo">¿Qué edad tiene quien va a aprender?</h2>
        <div className="edades__lista">
          {tramos.map(tramo => (
            <Link
              key={tramo.id}
              className={`edad${tramo.temas + tramo.ejercicios === 0 ? " edad--vacia" : ""}`}
              href={`/${slug}/edad/${tramo.id}/`}
            >
              <strong>{tramo.titulo}</strong>
              <span>{tramo.etapa}</span>
              <span className="edad__cuenta">
                {tramo.temas + tramo.ejercicios === 0
                  ? "Todavía sin contenido"
                  : `${tramo.temas} ${tramo.temas === 1 ? "tema" : "temas"} · ${tramo.ejercicios} ${tramo.ejercicios === 1 ? "ejercicio" : "ejercicios"}`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className="acciones">
        <Link className="boton" href={`/${slug}/practicar/`}>Practicar {materia.nombre}</Link>
        {preguntas.some(p => p.familia === "diagnostico") && (
          <Link className="boton boton--suave" href={`/${slug}/diagnostico/`}>Diagnóstico</Link>
        )}
      </p>

      {/* La agrupación por categoría y el filtrado viven en el buscador, que es
          cliente: el resto de la página se sirve como HTML ya hecho. */}
      <Buscador materia={materia} paginas={paginas} />
    </main>
  );
}
