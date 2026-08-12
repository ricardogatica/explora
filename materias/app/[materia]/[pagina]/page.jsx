import Link from "next/link";
import Migas from "../../migas.jsx";
import Figura from "../../figura.jsx";
import Actividad from "../../actividad.jsx";
import { MATERIAS, materiaPorSlug, paginaDe, paginasDe, hermanasDeTramo } from "../../../lib/contenido.js";

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
  const tramo = hermanasDeTramo(slug, id);

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
      <article className="prosa">
        {ficha.bloques.map((bloque, indice) => {
          if (bloque.tipo === "figura") {
            return <Figura key={indice} tipo={bloque.figura} titulo={bloque.titulo} {...bloque.parametros} />;
          }
          if (bloque.tipo === "actividad") {
            return <Actividad key={indice} nombre={bloque.actividad} titulo={bloque.titulo} {...bloque.parametros} />;
          }
          /* El markdown es contenido de este repositorio, no entra nada de fuera. */
          return <div key={indice} dangerouslySetInnerHTML={{ __html: bloque.html }} />;
        })}
      </article>

      {/* Lo que más falta hacía en las páginas de nivel: describían un tramo de edad
          y no llevaban a ninguna parte. Sale en toda página con banda, porque la
          pregunta «¿y qué más le toca a esta edad?» es la misma en todas. */}
      {tramo.materias.length > 0 && (
        <section className="tramo">
          <h2 className="tramo__titulo">Contenidos de este tramo</h2>
          {tramo.bandas.length > 0 && (
            <p className="tramo__pie">
              {tramo.bandas.map(banda => (
                <Link key={banda.id} className="boton boton--suave" href={`/ruta/${banda.id}/`}>
                  Ver la ruta de {banda.titulo}
                </Link>
              ))}
            </p>
          )}
          {tramo.materias.map(materia => (
            <div key={materia.slug} className="tramo__materia">
              <h3 className="tramo__nombre">
                {materia.nombre}
                {materia.todas > materia.paginas.length && (
                  <> · <Link href={`/${materia.slug}/edad/${tramo.bandas[0]?.id ?? (ficha.bandas ?? [])[0]}/`}>
                    ver los {materia.todas}
                  </Link></>
                )}
              </h3>
              {/* Las mismas clases que usa el buscador: la tarjeta de una página se
                  ve igual en todo el sitio y no hay una segunda hoja de estilos que
                  mantener. */}
              <div className="rejilla">
                {materia.paginas.map(pagina => (
                  <Link key={pagina.id} className="tarjeta" href={`/${materia.slug}/${pagina.id}/`}>
                    <strong>{pagina.titulo}</strong>
                    <span>{pagina.descripcion}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
