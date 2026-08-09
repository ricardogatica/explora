import Link from "next/link";
import Migas from "../migas.jsx";
import { MATERIAS, materiaPorSlug, paginasDe, preguntasDe } from "../../lib/contenido.js";

export function generateStaticParams() {
  return MATERIAS.map(materia => ({ materia: materia.slug }));
}

export default async function Materia({ params }) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);
  const paginas = paginasDe(slug);
  const preguntas = preguntasDe(slug);

  /* Las páginas se agrupan por categoría, que es como las tenía el manifiesto y
     como se leen: «Ortografía», «Diagnóstico». El orden es el del archivo, que
     es deliberado y no alfabético. */
  const categorias = [...new Set(paginas.map(p => p.categoria))];

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

      {categorias.map(categoria => (
        <section key={categoria}>
          <h2>{categoria}</h2>
          <div className="rejilla">
            {paginas.filter(p => p.categoria === categoria).map(pagina => (
              <Link key={pagina.id} className="tarjeta" href={`/${slug}/${pagina.id}/`}>
                <strong>{pagina.titulo}</strong>
                <span>{pagina.descripcion}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
