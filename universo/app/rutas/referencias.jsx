import { Migas } from "../componentes.jsx";
import datos from "../datos/referencias.json";

export function meta() {
  return [
    { title: "Referencias · Universo · Explora" },
    { name: "description", content: "De dónde salen los datos del universo y bajo qué licencia se usan." }
  ];
}

/* Esta página no es documentación: es la atribución que exigen las licencias del
   catálogo del cielo (CC BY-SA 4.0) y de las texturas (CC BY 4.0). Tiene que
   seguir siendo visible, y hay un test que lo comprueba.

   Las tarjetas se extrajeron del referencias.html anterior con un script, no
   copiándolas a mano: son textos legales y transcribir a ojo es como se pierden
   las frases que importan. El <strong> y el <code> del original se conservan
   porque marcan justo lo que no se puede saltar. */
export default function Referencias() {
  return (
    <main className="pagina">
      <Migas tramos={[{ texto: "Referencias" }]} />
      <p className="eyebrow">Fuentes del atlas</p>
      <h1>Referencias</h1>
      {datos.intro.map((parrafo, i) => (
        <p key={i} className="subtitle" dangerouslySetInnerHTML={{ __html: parrafo }} />
      ))}

      <div className="referencias">
        {datos.tarjetas.map(tarjeta => (
          <article key={tarjeta.titulo + tarjeta.epigrafe} className="referencia">
            <p className="eyebrow">{tarjeta.epigrafe}</p>
            <h2>{tarjeta.titulo}</h2>
            {tarjeta.parrafos.map((parrafo, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: parrafo }} />
            ))}
            {tarjeta.enlace && (
              <a className="referencia__enlace" href={tarjeta.enlace.href} target="_blank" rel="noreferrer">
                {tarjeta.enlace.texto}
              </a>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
