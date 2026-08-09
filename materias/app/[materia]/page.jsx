import Link from "next/link";
import Migas from "../migas.jsx";
import Buscador from "../buscador.jsx";
import { MATERIAS, materiaPorSlug, paginasDe, preguntasDe } from "../../lib/contenido.js";

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

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre }]} />
      <p className="eyebrow">Materia</p>
      <h1>{materia.nombre}</h1>
      <p className="subtitle">
        {materia.descripcion} {paginas.length} páginas y {preguntas.length} preguntas.
      </p>

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
