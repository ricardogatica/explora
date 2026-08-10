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
/* Los cinco que la Unión Astronómica Internacional reconoce hoy. Se listan
   porque la pregunta «¿y Plutón?» la hace todo el mundo, y merece una respuesta
   mejor que «lo quitaron». */
const PLANETAS_ENANOS = [
  { nombre: "Ceres", donde: "En el cinturón de asteroides. Es el mayor de todos ellos." },
  { nombre: "Plutón", donde: "En el cinturón de Kuiper. Fue el noveno planeta de 1930 a 2006." },
  { nombre: "Haumea", donde: "En el Kuiper. Gira tan rápido que se ha quedado con forma de huevo." },
  { nombre: "Makemake", donde: "En el Kuiper, un poco más pequeño que Plutón." },
  { nombre: "Eris", donde: "Más lejos aún. Descubrirlo fue lo que obligó a decidir qué es un planeta." }
];

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

function TarjetaDePlaneta({ slug }) {
  const cuerpo = BODY_DATA[slug];
  return (
    <Link className="tarjeta" to={`/cuerpos/${slug}`}>
      <strong>{cuerpo.name}</strong>
      <span>{cuerpo.type} · {cuerpo.distance}</span>
    </Link>
  );
}

export default function SistemaSolar() {
  const planetas = BODY_ORDER.filter(slug => slug !== "sun");
  /* Rocosos y gigantes, según lo que dice el propio dato de cada cuerpo. La
     división no es de adorno: explica dónde se formó cada uno, y por eso la
     lista va partida en dos y no seguida. */
  const rocosos = planetas.filter(slug => /rocoso/i.test(BODY_DATA[slug].type));
  const gigantes = planetas.filter(slug => !/rocoso/i.test(BODY_DATA[slug].type));
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

      <h2>¿Cómo se formó?</h2>
      <p>
        Hace 4.568 millones de años, aquí no había más que una nube enorme de gas y polvo,
        fría y oscura. Algo la empujó —quizá la explosión de una estrella cercana— y la nube
        empezó a caer sobre sí misma.
      </p>
      <p>
        Al caer giraba, y al girar se fue aplanando, como la masa de una pizza cuando se voltea.
        Casi todo el material acabó en el centro: ahí se encendió el Sol. Con lo que sobró, que
        quedó dando vueltas en un disco, se fueron pegando granos de polvo hasta formar rocas,
        las rocas se juntaron en peñascos y los peñascos, en planetas. Tardó unos pocos millones
        de años, que para el universo es un suspiro.
      </p>
      <p>
        Por eso todos los planetas giran en el mismo sentido y casi en el mismo plano, como los
        caballitos de un tiovivo: heredaron el giro de aquel disco. Y por eso la escena de arriba
        se puede dibujar casi plana sin mentir demasiado.
      </p>

      <h2>¿Por qué unos planetas son de roca y otros de gas?</h2>
      <p>
        Porque cerca del Sol hacía calor y lejos hacía frío. En el disco había una frontera
        invisible —los astrónomos la llaman <strong>línea de hielo</strong>— más o menos donde hoy
        está el cinturón de asteroides.
      </p>
      <p>
        Dentro de esa línea el calor evaporaba el agua y el gas, y solo quedaba lo que aguanta
        altas temperaturas: roca y metal. De ahí salieron cuatro planetas pequeños y duros.
        Fuera de la línea el agua se congelaba, así que había mucho más material del que tirar:
        esos planetas crecieron tanto que su gravedad atrapó también gas, y por eso son enormes.
      </p>

      <h2>Los {planetas.length} planetas</h2>
      <h3 className="grupo">Los {rocosos.length} rocosos, dentro de la línea de hielo</h3>
      <div className="rejilla">
        {rocosos.map(slug => <TarjetaDePlaneta key={slug} slug={slug} />)}
      </div>
      <h3 className="grupo">Los {gigantes.length} gigantes, fuera de ella</h3>
      <div className="rejilla">
        {gigantes.map(slug => <TarjetaDePlaneta key={slug} slug={slug} />)}
      </div>

      <h2>¿Y Plutón?</h2>
      <p>
        Fue el noveno planeta durante 76 años. En 2006, los astrónomos del mundo se pusieron de
        acuerdo en qué hace falta para ser planeta: dar vueltas al Sol, ser lo bastante grande
        como para que la gravedad te vuelva redondo, y <strong>haber despejado tu órbita</strong>,
        es decir, ser el mandamás de tu camino.
      </p>
      <p>
        Plutón cumple las dos primeras pero no la tercera: comparte el vecindario con miles de
        cuerpos helados parecidos a él. Así que no lo degradaron por pequeño, sino por tener
        demasiada compañía. Se creó una categoría nueva para él y para otros como él.
      </p>
      <div className="rejilla">
        {PLANETAS_ENANOS.map(enano => (
          <article key={enano.nombre} className="tarjeta tarjeta--texto">
            <strong>{enano.nombre}</strong>
            <span>{enano.donde}</span>
          </article>
        ))}
      </div>

      <h2>¿Qué lo mantiene todo unido?</h2>
      <p>
        La gravedad del Sol, y no le cuesta ningún esfuerzo: el Sol pesa más de setecientas
        veces lo que pesan juntos los ocho planetas, sus lunas, los asteroides y los cometas.
        Todo lo demás son las migas.
      </p>
      <p>
        La Tierra no cae al Sol porque va muy rápido de lado: recorre 30 kilómetros cada
        segundo. Es como hacer girar una piedra atada a una cuerda —si sueltas la cuerda sale
        disparada, y si la piedra se parase, caería—. La gravedad es esa cuerda.
      </p>

      <h2>¿Cuánto se tarda en llegar?</h2>
      <p>
        Las distancias del sistema solar se miden en <strong>unidades astronómicas</strong>: una
        UA es lo que hay de la Tierra al Sol, casi 150 millones de kilómetros. Neptuno está a 30 UA.
      </p>
      <p>
        La luz es lo más rápido que existe y tarda <strong>8 minutos y 20 segundos</strong> en
        venir del Sol a la Tierra: cuando lo miras, lo estás viendo como era hace ocho minutos.
        Esa misma luz tarda cuatro horas en alcanzar a Neptuno. Una nave, que va muchísimo más
        despacio, tarda años: la Voyager 2 estuvo doce en llegar allí.
      </p>

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

      <h2>¿Dónde acaba el sistema solar?</h2>
      <p>
        Depende de qué se cuente, y las dos respuestas son buenas.
      </p>
      <p>
        Si se cuenta hasta donde llega el <strong>viento del Sol</strong> —un chorro de partículas
        que sale de él en todas direcciones—, el borde está a unas 120 UA. Ahí se para, empujado
        por el gas que hay entre las estrellas. Dos naves lo han cruzado: la Voyager 1 en 2012 y
        la Voyager 2 en 2018, y siguen enviando datos desde el otro lado.
      </p>
      <p>
        Si se cuenta hasta donde llega la <strong>gravedad del Sol</strong>, el sistema solar es
        muchísimo más grande: la nube de Oort llegaría casi a dos años luz, casi la mitad del
        camino hasta la estrella más cercana. Con esa medida, las Voyager tardarían unos treinta
        mil años en salir de verdad.
      </p>
      <p>
        Ese «llegaría» es a propósito. <strong>Nadie ha visto nunca la nube de Oort</strong>: se
        deduce de por dónde vienen los cometas de periodo largo, que caen desde todas las
        direcciones y desde muy lejos. Es una idea muy bien fundada, pero todavía es una idea, y
        no está de más saber distinguir las dos cosas.
      </p>

      <p className="nota">
        De dónde salen estos datos, y qué se ha redondeado para que se lean, está en la{" "}
        <Link to="/referencias">página de referencias</Link>.
      </p>

      <nav className="hermanos">
        <Link className="boton boton--suave" to="/escala-planetaria">‹ Ver la escala planetaria</Link>
        <Link className="boton boton--suave" to="/cuerpos/sun">Abrir la ficha del Sol ›</Link>
      </nav>
    </main>
  );
}
