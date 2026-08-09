import Link from "next/link";
import Migas from "../../migas.jsx";
import Practica from "../../practica.jsx";
import { MATERIAS, materiaPorSlug, preguntasDe } from "../../../lib/contenido.js";

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
  /* Solo la práctica: los diagnósticos son otra cosa —los responde un adulto
     observando— y mezclarlos aquí convertiría un rato de ejercicios en una
     evaluación sin avisar. */
  const preguntas = preguntasDe(slug).filter(p => p.familia === "practica");

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: materia.nombre, href: `/${slug}/` }, { texto: "Practicar" }]} />
      <p className="eyebrow">Ejercicios</p>
      <h1>Practicar {materia.nombre}</h1>
      <p className="subtitle">
        {preguntas.length} ejercicios que se corrigen solos y explican por qué.
      </p>
      {preguntas.length > 0
        ? <Practica preguntas={preguntas} />
        : <p className="vacio">Esta materia todavía no tiene ejercicios.</p>}
    </main>
  );
}
