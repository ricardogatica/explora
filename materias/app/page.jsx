import Link from "next/link";
import { MATERIAS, ruta } from "../lib/contenido.js";

export default function Portada() {
  const tramos = ruta();
  const total = tramos.reduce((suma, banda) => suma + banda.total, 0);

  return (
    <main>
      <p className="eyebrow">Base de conocimiento interactivo</p>
      <h1>Explora</h1>
      <p className="subtitle">
        Contenido y preguntas por materia, con una ruta de aprendizaje que va de los 5 a los
        17 años. Pensada también para el adulto que acompaña.
      </p>

      <h2>Materias</h2>
      <div className="rejilla">
        {MATERIAS.map(materia => (
          <Link key={materia.slug} className="tarjeta" href={`/${materia.slug}/`}>
            <strong>{materia.nombre}</strong>
            <span>{materia.descripcion}</span>
          </Link>
        ))}
      </div>

      <h2>Ruta de aprendizaje</h2>
      <p className="subtitle">{total} preguntas repartidas por edad, atravesando las materias.</p>
      <div className="rejilla">
        {tramos.map(banda => (
          <Link key={banda.id} className="tarjeta" href={`/ruta/${banda.id}/`}>
            <strong>{banda.titulo}</strong>
            <span>{banda.etapa} · {banda.total} preguntas</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
