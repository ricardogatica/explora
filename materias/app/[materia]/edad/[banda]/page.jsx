import Link from "next/link";
import Migas from "../../../migas.jsx";
import {
  MATERIAS, materiaPorSlug, paginasDeMateriaYBanda, preguntasDeMateriaYBanda, bandaAnterior
} from "../../../../lib/contenido.js";
import { BANDAS, bandaPorId } from "@explora/contenido/bandas.js";

/* Una materia a una edad concreta.

   Es el paso que faltaba entre «entro en matemáticas» y «hago ejercicios»: elegir
   el tramo. Antes solo existían los dos extremos —la materia entera, con sus
   cuarenta y tantas páginas, o la ruta global, que mezcla las materias— y en medio
   no había nada.

   La URL lleva «edad» y no es adorno: sin ella, /matematicas/9-10/ se confundiría
   con una página llamada «9-10», que es la misma forma que /matematicas/potencias/.
   Un contenido que se llamara así dejaría el tramo inaccesible sin dar ningún
   error. */

export function generateStaticParams() {
  return MATERIAS.flatMap(materia =>
    BANDAS.map(banda => ({ materia: materia.slug, banda: banda.id }))
  );
}

export async function generateMetadata({ params }) {
  const { materia, banda } = await params;
  const nombre = materiaPorSlug(materia).nombre;
  const tramo = bandaPorId(banda);
  return {
    title: `${nombre} de ${tramo.titulo} · Explora`,
    description: `Lo que toca de ${nombre.toLowerCase()} entre los ${tramo.desde} y los ${tramo.hasta} años.`
  };
}

export default async function MateriaPorEdad({ params }) {
  const { materia: slug, banda: id } = await params;
  const materia = materiaPorSlug(slug);
  const tramo = bandaPorId(id);
  const paginas = paginasDeMateriaYBanda(slug, id);
  const practica = preguntasDeMateriaYBanda(slug, id).filter(p => p.familia === "practica");
  const anterior = bandaAnterior(id);

  /* Los otros tramos, para poder cambiar de edad sin volver atrás: quien acompaña a
     dos hijos de edades distintas hace justo eso. */
  const otros = BANDAS.filter(banda => banda.id !== id);

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre, href: `/${slug}/` }, { texto: tramo.titulo }]} />
      <p className="eyebrow">{materia.nombre} · {tramo.etapa}</p>
      <h1>{materia.nombre} de {tramo.titulo}</h1>
      <p className="subtitle">
        {paginas.length === 0
          ? `Todavía no hay contenido de ${materia.nombre.toLowerCase()} para esta edad.`
          : `${paginas.length} ${paginas.length === 1 ? "tema" : "temas"} y ${practica.length} ${practica.length === 1 ? "ejercicio" : "ejercicios"}.`}
      </p>

      {(paginas.length > 0 || practica.length > 0) && (
        <p className="acciones">
          {practica.length > 0 && (
            <Link className="boton" href={`/${slug}/edad/${id}/practicar/`}>
              Practicar {tramo.titulo}
            </Link>
          )}
          <Link className="boton boton--suave" href={`/ruta/${id}/`}>Ver todas las materias de esta edad</Link>
        </p>
      )}

      {paginas.length > 0 && (
        <>
          <h2>Para leer</h2>
          <div className="rejilla">
            {paginas.map(pagina => (
              <Link key={pagina.id} className="tarjeta" href={`/${slug}/${pagina.id}/`}>
                <strong>{pagina.titulo}</strong>
                <span>{pagina.descripcion}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* La puerta de atrás, siempre visible y no solo cuando algo sale mal:
          repasar lo anterior antes de empezar es tan válido como hacerlo después de
          atascarse. */}
      {anterior && (
        <p className="acciones acciones--sueltas">
          <Link className="boton boton--suave" href={`/${slug}/edad/${anterior.id}/`}>
            ‹ Repasar {materia.nombre.toLowerCase()} de {anterior.titulo}
          </Link>
        </p>
      )}

      <h2>Otras edades</h2>
      <p className="acciones">
        {otros.map(banda => (
          <Link key={banda.id} className="boton boton--suave" href={`/${slug}/edad/${banda.id}/`}>
            {banda.titulo}
          </Link>
        ))}
      </p>
    </main>
  );
}
