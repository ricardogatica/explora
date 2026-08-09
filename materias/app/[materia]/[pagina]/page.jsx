import Link from "next/link";
import Migas from "../../migas.jsx";
import { MATERIAS, materiaPorSlug, paginaDe, paginasDe } from "../../../lib/contenido.js";

/* Con output: "export" hay que enumerar TODAS las rutas dinámicas: no existe la
   generación bajo demanda. Para un sitio hecho de archivos es lo natural. */
export function generateStaticParams() {
  return MATERIAS.flatMap(materia =>
    paginasDe(materia.slug).map(pagina => ({ materia: materia.slug, pagina: pagina.id }))
  );
}

export async function generateMetadata({ params }) {
  const { materia, pagina } = await params;
  const ficha = paginaDe(materia, pagina);
  return { title: `${ficha.titulo} · ${materiaPorSlug(materia).nombre} · Explora`, description: ficha.descripcion };
}

export default async function Pagina({ params }) {
  const { materia: slug, pagina: id } = await params;
  const materia = materiaPorSlug(slug);
  const ficha = paginaDe(slug, id);

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre, href: `/${slug}/` }, { texto: ficha.titulo }]} />
      <p className="etiquetas">
        <span className="etiqueta">{ficha.categoria}</span>
        {(ficha.bandas ?? []).map(banda => (
          <Link key={banda} className="etiqueta etiqueta--banda" href={`/ruta/${banda}/`}>
            {banda === "previo" ? "Antes de los 5" : `${banda} años`}
          </Link>
        ))}
      </p>
      {/* El markdown es contenido de este repositorio, no entra nada de fuera. */}
      <article className="prosa" dangerouslySetInnerHTML={{ __html: ficha.html }} />
    </main>
  );
}
