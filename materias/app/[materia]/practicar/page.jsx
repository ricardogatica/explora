import Link from "next/link";
import Migas from "../../migas.jsx";
import {
  MATERIAS, materiaPorSlug, preguntasDeMateriaYBanda
} from "../../../lib/contenido.js";
import { BANDAS } from "@explora/contenido/bandas.js";

/* Practicar va por edad, igual que el diagnóstico.

   Practicar «toda la materia» juntaba ejercicios de los 5 y de los 17 años en la
   misma tanda, que no le sirve a nadie: quien practica tiene una edad. Esta página
   conserva su dirección y reparte.

   Y el reparto no es solo cosmético: en la práctica por edad cada pregunta lleva
   consigo a dónde volver si se atasca, y eso solo se puede calcular sabiendo de qué
   tramo es. */

export function generateStaticParams() {
  return MATERIAS.map(materia => ({ materia: materia.slug }));
}

export async function generateMetadata({ params }) {
  const { materia } = await params;
  return { title: `Practicar ${materiaPorSlug(materia).nombre} · Explora` };
}

export default async function Practicar({ params }) {
  const { materia: slug } = await params;
  const materia = materiaPorSlug(slug);

  const tramos = BANDAS.map(banda => ({
    ...banda,
    cuantas: preguntasDeMateriaYBanda(slug, banda.id).filter(p => p.familia === "practica").length
  }));
  const total = tramos.reduce((suma, tramo) => suma + tramo.cuantas, 0);

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre, href: `/${slug}/` }, { texto: "Practicar" }]} />
      <p className="eyebrow">Ejercicios</p>
      <h1>Practicar {materia.nombre}</h1>

      {total === 0 ? (
        <p className="subtitle">{materia.nombre} todavía no tiene ejercicios.</p>
      ) : (
        <>
          <p className="subtitle">
            Los ejercicios van por edad: elige el tramo. Se corrigen solos, explican por qué, y
            si algo se atasca dicen a qué volver.
          </p>
          <div className="edades__lista">
            {tramos.filter(tramo => tramo.cuantas > 0).map(tramo => (
              <Link key={tramo.id} className="edad" href={`/${slug}/edad/${tramo.id}/practicar/`}>
                <strong>{tramo.titulo}</strong>
                <span>{tramo.etapa}</span>
                <span className="edad__cuenta">{tramo.cuantas} ejercicios</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
