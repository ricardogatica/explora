import { Link } from "react-router";
import { Migas } from "../componentes.jsx";
import Escena from "../escena.jsx";
import { BODY_DATA, BODY_ORDER } from "../../cielo/data.js";

export function meta() {
  return [
    { title: "Sistema Solar · Universo · Explora" },
    {
      name: "description",
      content: "El Sol, ocho planetas, sus lunas, el cinturón de asteroides y los cometas: " +
        "qué hay en el sistema solar, a qué distancia y desde cuándo."
    }
  ];
}

/* La ficha del sistema solar entero.

   Había ficha de cada cuerpo y ninguna del conjunto, que es raro: lo primero
   que quiere saber alguien es cuántos planetas hay, desde cuándo y hasta dónde
   llega. Estas son las respuestas.

   Los planetas y sus cifras salen del mismo sitio del que se dibuja la escena
   3D, así que no hay dos verdades: añadir un cuerpo lo añade aquí. Lo que no
   se puede derivar —la edad, la distancia al centro de la galaxia— está escrito
   con su fuente en la página de referencias. */

/* Lo que hay además de los planetas. No está todo en la escena 3D y conviene
   decirlo: una vista que enseña ocho bolas y un cinturón deja fuera la mayor
   parte de lo que hay ahí fuera, y callarlo enseña un sistema solar más vacío
   del que es. */
const TAMBIEN_HAY = [
  {
    titulo: "Cinturón de asteroides",
    texto: "Entre Marte y Júpiter, más de un millón de rocas de más de un kilómetro. " +
      "Sumadas pesan menos que la Luna: nunca llegaron a formar un planeta.",
    enLaEscena: true
  },
  {
    titulo: "Cometas",
    texto: "Bolas de hielo y polvo en órbitas muy alargadas. Al acercarse al Sol el hielo " +
      "se sublima y forma una cola que apunta siempre al lado contrario del Sol, no hacia atrás.",
    enLaEscena: true
  },
  {
    titulo: "Cinturón de Kuiper",
    texto: "Más allá de Neptuno, un segundo anillo de cuerpos helados. Ahí está Plutón, y de ahí " +
      "vienen los cometas de periodo corto.",
    enLaEscena: false
  },
  {
    titulo: "Nube de Oort",
    texto: "Una envoltura de hielo a unas 100.000 veces la distancia de la Tierra al Sol: casi " +
      "dos años luz. Es el borde real del sistema solar y de ahí caen los cometas de periodo largo.",
    enLaEscena: false
  }
];

export default function SistemaSolar() {
  const planetas = BODY_ORDER.filter(slug => slug !== "sun");
  const masLejano = planetas.reduce((lejos, slug) =>
    BODY_DATA[slug].orbitRadius > BODY_DATA[lejos].orbitRadius ? slug : lejos, planetas[0]);

  const datos = [
    ["Estrella", "El Sol, que reúne el 99,86 % de toda la masa del sistema"],
    ["Planetas", `${planetas.length}, de Mercurio a ${BODY_DATA[masLejano].name}`],
    ["Lunas conocidas", "Más de 400, la mayoría de Júpiter y Saturno"],
    ["Edad", "4.568 millones de años"],
    ["Hasta Neptuno", "4.500 millones de km (30 veces la distancia Tierra–Sol)"],
    ["Hasta el borde", "Unos 2 años luz, contando la nube de Oort"],
    ["Del centro de la galaxia", "26.000 años luz, en el Brazo de Orión"],
    ["Una vuelta a la galaxia", "225 millones de años"]
  ];

  return (
    <main className="pagina">
      <Migas tramos={[{ texto: "Índice", a: "/indice" }, { texto: "Sistema Solar" }]} />
      <p className="eyebrow">Sistema planetario</p>
      <h1>Sistema Solar</h1>
      <p className="subtitle">
        Una estrella corriente y todo lo que gira a su alrededor: ocho planetas, sus lunas,
        millones de asteroides y los cometas que cruzan de vez en cuando. Se formó hace 4.568
        millones de años del colapso de una nube de gas y polvo, y sigue dando vueltas al centro
        de la Vía Láctea.
      </p>

      {/* Debajo del título y la descripción, como el resto de las fichas. */}
      <Escena sistemaSolar alto={520} />

      <dl className="datos">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="nota">
        En la escena las órbitas están comprimidas y los planetas dibujados mucho más grandes de
        lo que les toca. A escala de verdad, con la órbita de Neptuno cabiendo en el recuadro, la
        Tierra mediría menos de un píxel y no se vería ninguno. Los tamaños reales, unos junto a
        otros, están en la <Link to="/escala-planetaria">escala planetaria</Link>.
      </p>

      <h2>Los {planetas.length} planetas</h2>
      <div className="rejilla">
        {planetas.map(slug => {
          const cuerpo = BODY_DATA[slug];
          return (
            <Link key={slug} className="tarjeta" to={`/cuerpos/${slug}`}>
              <strong>{cuerpo.name}</strong>
              <span>{cuerpo.type} · {cuerpo.distance}</span>
            </Link>
          );
        })}
      </div>

      <h2>Qué más hay</h2>
      <div className="rejilla">
        {TAMBIEN_HAY.map(cosa => (
          <article key={cosa.titulo} className="tarjeta tarjeta--texto">
            <strong>{cosa.titulo}</strong>
            <span>{cosa.texto}</span>
            {!cosa.enLaEscena && <em className="tarjeta__apunte">No se dibuja en esta vista</em>}
          </article>
        ))}
      </div>

      <nav className="hermanos">
        <Link className="boton boton--suave" to="/escala-planetaria">‹ Ver la escala planetaria</Link>
        <Link className="boton boton--suave" to="/cuerpos/sun">Abrir la ficha del Sol ›</Link>
      </nav>
    </main>
  );
}
