/* El recorrido de la barra de zoom, por tramos.

   La escena abarca de 6 a 140.000 unidades, y en ese recorrido hay dos sitios
   donde mirar y un desierto en medio:

     6 – 3.400        el sistema solar y el vecindario de estrellas
     3.400 – 40.000   nada: se salió del barrio y la galaxia aún no se lee
     40.000 – 140.000 la Vía Láctea entera

   Con un recorrido logarítmico uniforme, ese desierto se llevaba un tercio de
   la barra: se arrastraba y se arrastraba mirando negro. Así que cada tramo
   recibe el trozo de barra que merece por lo que hay que ver en él, y el del
   medio recibe casi nada. El efecto es el que se busca: al salir de las
   constelaciones, la cámara cruza el vacío de un tirón y aparece la galaxia.

   Dentro de cada tramo el avance es logarítmico —cada paso multiplica la
   distancia por lo mismo—, que es como se mira el cielo: por órdenes de
   magnitud y no por sumas.

   Vive aparte de la escena porque es aritmética pura, y porque `distanciaDe` y
   `zoomDe` tienen que ser exactamente inversas: si no lo son, mover la cámara
   a mano deja la barra marcando otra cosa y el primer golpe de rueda salta de
   vuelta a lo que dice la barra. Eso se prueba, no se confía. */

export const DISTANCIA_MINIMA = 6;

/* `hasta` es la distancia en la que acaba el tramo; `barra`, la fracción de la
   barra en la que acaba. */
export const TRAMOS = [
  { hasta: 3400, barra: 0.72 },     // el sistema solar y las constelaciones
  { hasta: 40000, barra: 0.79 },    // el salto: mucho camino en muy poca barra
  { hasta: 140000, barra: 1 }       // la galaxia
];

const limitar = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo);

/* Porcentaje de barra (0–100) → distancia de cámara. */
export function distanciaDe(porcentaje) {
  const objetivo = limitar(porcentaje, 0, 100) / 100;
  let desdeDistancia = DISTANCIA_MINIMA, desdeBarra = 0;

  for (const tramo of TRAMOS) {
    if (objetivo <= tramo.barra || tramo === TRAMOS[TRAMOS.length - 1]) {
      const dentro = (objetivo - desdeBarra) / (tramo.barra - desdeBarra);
      return desdeDistancia * Math.pow(tramo.hasta / desdeDistancia, limitar(dentro, 0, 1));
    }
    desdeDistancia = tramo.hasta;
    desdeBarra = tramo.barra;
  }
  return TRAMOS[TRAMOS.length - 1].hasta;
}

/* Distancia de cámara → porcentaje de barra. La inversa exacta de la anterior. */
export function zoomDe(distancia) {
  const objetivo = Math.max(distancia, DISTANCIA_MINIMA);
  let desdeDistancia = DISTANCIA_MINIMA, desdeBarra = 0;

  for (const tramo of TRAMOS) {
    if (objetivo <= tramo.hasta || tramo === TRAMOS[TRAMOS.length - 1]) {
      const dentro = Math.log(objetivo / desdeDistancia) / Math.log(tramo.hasta / desdeDistancia);
      return limitar(desdeBarra + limitar(dentro, 0, 1) * (tramo.barra - desdeBarra), 0, 1) * 100;
    }
    desdeDistancia = tramo.hasta;
    desdeBarra = tramo.barra;
  }
  return 100;
}
