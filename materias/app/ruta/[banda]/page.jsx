import Link from "next/link";
import Migas from "../../migas.jsx";
import { bandaDetalle, ruta } from "../../../lib/contenido.js";

export function generateStaticParams() {
  return ruta().map(banda => ({ banda: banda.id }));
}

export async function generateMetadata({ params }) {
  const { banda: id } = await params;
  const banda = bandaDetalle(id);
  return { title: `${banda.titulo} · Ruta · Explora`, description: banda.etapa };
}

export default async function Banda({ params }) {
  const { banda: id } = await params;
  const banda = bandaDetalle(id);

  return (
    <main>
      <Migas tramos={[{ texto: "Ruta de aprendizaje", href: "/ruta/" }, { texto: banda.titulo }]} />
      <p className="eyebrow">{banda.etapa}</p>
      <h1>{banda.titulo}</h1>

      {banda.materias.length === 0 ? (
        /* Un tramo vacío se dice, no se esconde: quien acompaña a un niño de esa
           edad tiene que saber que aquí todavía no hay nada, en vez de creer que
           no encuentra la página. */
        <p className="vacio">
          Este tramo todavía no tiene contenido. Está identificado y pendiente de escribir.
        </p>
      ) : (
        banda.materias.map(materia => (
          <section key={materia.slug}>
            <h2>
              <Link href={`/${materia.slug}/`}>{materia.nombre}</Link>{" "}
              <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 16 }}>
                · {materia.preguntas.length} preguntas
              </span>
            </h2>
            <div className="rejilla">
              {[...new Set(materia.preguntas.map(p => p.categoria ?? p.habilidad))].map(tema => (
                <div key={tema} className="tarjeta">
                  <strong>{tema}</strong>
                  <span>
                    {materia.preguntas.filter(p => (p.categoria ?? p.habilidad) === tema).length} preguntas
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
