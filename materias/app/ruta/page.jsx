import Link from "next/link";
import Migas from "../migas.jsx";
import { ruta } from "../../lib/contenido.js";

export const metadata = {
  title: "Ruta de aprendizaje 5–17 · Explora",
  description: "Qué trabajar a cada edad, de los 5 a los 17 años, atravesando las materias."
};

export default function Ruta() {
  const tramos = ruta();
  return (
    <main>
      <Migas tramos={[{ texto: "Ruta de aprendizaje" }]} />
      <p className="eyebrow">De 5 a 17 años</p>
      <h1>Ruta de aprendizaje</h1>
      <p className="subtitle">
        Seis tramos que cubren todas las edades sin huecos ni solapes. Cada uno reúne lo que
        hay en todas las materias, para acompañar sin tener que saber de qué asignatura viene.
      </p>
      <div className="rejilla">
        {tramos.map(banda => (
          <Link key={banda.id} className="tarjeta" href={`/ruta/${banda.id}/`}>
            <strong>{banda.titulo}</strong>
            <span>
              {banda.etapa} · {banda.total
                ? `${banda.total} preguntas en ${banda.materias.length} materia${banda.materias.length > 1 ? "s" : ""}`
                : "todavía sin contenido"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
