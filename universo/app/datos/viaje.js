/* El viaje por el universo: las paradas, en orden, de fuera hacia casa.

   Empieza donde nada de lo nuestro se ve —la galaxia entera, con el sistema
   solar convertido en un punto— y acaba en la Tierra. Ese orden no es un
   capricho: contado al revés, cada parada haría más pequeño lo anterior y la
   sensación final sería de encogimiento. Contado así, cada parada acerca, y se
   llega a casa habiendo entendido dónde está.

   Cada parada dice QUÉ pedirle a la escena, no cómo moverse: la escena sabe
   encuadrar sus cosas y este archivo no tiene por qué saber de cámaras. Los
   nombres de `hacer` son los métodos que expone la escena; hay una prueba que
   comprueba que existen todos, porque un nombre mal escrito aquí sería una
   parada muda que nadie notaría hasta verla.

   Los textos son cortos a propósito. Se leen mientras la cámara se mueve, y en
   diez segundos no caben dos párrafos: una idea por parada. */

export const PARADAS = [
  {
    id: "espacio-profundo",
    titulo: "Espacio profundo",
    texto: "Esta es nuestra galaxia vista desde fuera: cien mil millones de estrellas. " +
      "El punto de la derecha, sobre ese aro, es el Sol. Todo lo que conoces cabe ahí.",
    segundos: 12,
    hacer: "enfocarViaLactea"
  },
  {
    id: "escalas-y-luz",
    titulo: "La luz y las escalas del universo",
    texto: "La luz es lo más rápido que existe y aun así tarda. Del Sol a la Tierra, ocho " +
      "minutos. De un lado a otro de la galaxia, cien mil años. Mirar lejos es mirar al pasado.",
    segundos: 12,
    hacer: "enfocarEscalas"
  },
  {
    id: "viaje-del-sistema-solar",
    titulo: "El viaje del Sistema Solar",
    texto: "El Sol no está quieto: da vueltas al centro de la galaxia a 230 kilómetros por " +
      "segundo. Una vuelta entera tarda 225 millones de años. Ese es el aro que se ve.",
    segundos: 12,
    hacer: "enfocarOrbitaDelSol"
  },
  {
    id: "ojo-y-sensor",
    titulo: "Ojo humano contra sensor",
    texto: "Tu ojo recoge luz durante un instante; una cámara puede recogerla durante horas. " +
      "Mira cómo aparecen estrellas que estaban ahí todo el tiempo.",
    segundos: 14,
    hacer: "compararOjoYSensor"
  },
  {
    id: "coordenadas",
    titulo: "Coordenadas celestes",
    texto: "Para encontrar algo en el cielo hacen falta dos números, como la latitud y la " +
      "longitud. Y un punto de partida: esta es Polaris, la estrella sobre la que todo gira.",
    segundos: 12,
    hacer: "enfocarPolaris"
  },
  {
    id: "constelaciones",
    titulo: "Constelaciones y planisferio",
    texto: "Una constelación no es un grupo de estrellas vecinas: es un dibujo que hacemos " +
      "uniendo puntos que están a distancias muy distintas. Solo funciona visto desde aquí.",
    segundos: 12,
    hacer: "enfocarVecindario"
  },
  {
    id: "optica",
    titulo: "Óptica y telescopios",
    texto: "A simple vista, una estrella es un punto por mucho que mires. Un telescopio recoge " +
      "más luz y separa lo que estaba pegado: acercarse es, en el fondo, ver más detalle.",
    segundos: 13,
    hacer: "enfocarVega"
  },
  {
    id: "planetas-y-gravedad",
    titulo: "Planetas y gravedad",
    texto: "Ocho planetas dando vueltas al Sol sin caerse: van tan rápido de lado que la caída " +
      "se convierte en órbita. Los de dentro son de roca; los de fuera, gigantes.",
    segundos: 12,
    hacer: "enfocarSistemaSolar"
  },
  {
    id: "cuerpos-menores",
    titulo: "Asteroides y cometas",
    texto: "Entre Marte y Júpiter hay más de un millón de rocas, y de vez en cuando cruza un " +
      "cometa con la cola apuntando siempre al lado contrario del Sol.",
    segundos: 12,
    hacer: "enfocarCinturon"
  },
  {
    id: "casa",
    titulo: "Y aquí vivimos",
    texto: "Un planeta con agua líquida, aire y vida, girando alrededor de una estrella " +
      "corriente, en un brazo cualquiera de la galaxia que acabas de ver entera.",
    segundos: 13,
    hacer: "enfocarTierra"
  }
];

export const DURACION_TOTAL = PARADAS.reduce((suma, parada) => suma + parada.segundos, 0);
