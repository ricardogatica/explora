/* El reloj de las escenas 3D.

   Las velocidades de este módulo están escritas como «cuánto avanza en un
   cuadro»: body.rotationSpeed, el 0,0008 de los anillos de Saturno, el 0,015 del
   polvo de la Tierra joven. Sumarlas una vez por cuadro ata la escena al refresco
   de la pantalla, y eso no es un detalle: medido en el navegador de pruebas, que
   va a 122 cuadros por segundo, el Sol de la escala de soles daba la vuelta en 17
   segundos en vez de 34. En un monitor de 60 Hz el módulo entero va a la mitad de
   velocidad que en uno de 120, y en uno de 240 al doble.

   El arreglo no es reescribir las velocidades —están ajustadas a ojo, una por
   una, mirando la escena— sino medir cuántos cuadros de referencia han pasado de
   verdad. `avance` vale 1 a 120 Hz, 2 a 60 Hz y 0,5 a 240 Hz, así que cada
   constante conserva su significado y la escena va igual de rápida en cualquier
   pantalla.

   La referencia son 120 Hz y no 60 porque es donde se ajustaron: en la pantalla
   del proyecto. Poner 60 dejaría todo el módulo al doble de rápido de lo que se
   aprobó mirándolo. */
export const HZ_DE_REFERENCIA = 120;

/* Tope del salto. Con la pestaña en segundo plano el navegador deja de entregar
   cuadros, y al volver entrega de golpe un intervalo de segundos: sin tope, los
   planetas darían un tirón de media órbita y las etapas de la línea temporal
   parpadearían. Cuatro cuadros de referencia son 33 ms, un pestañeo. */
const AVANCE_MAXIMO = 4;

export function crearReloj() {
  let anterior = null;
  return {
    /* Cuánto ha pasado desde la llamada anterior, en las dos unidades que usan
       las escenas: segundos, para las velocidades escritas por segundo, y
       cuadros de referencia, para las escritas por cuadro. Se llama una vez por
       cuadro, y las dos unidades salen del mismo intervalo y del mismo tope.

       `ms` es el sello de tiempo que entrega requestAnimationFrame. En el primer
       cuadro no hay intervalo que medir, así que se supone uno. */
    paso(ms) {
      const intervalo = anterior == null ? 1000 / HZ_DE_REFERENCIA : ms - anterior;
      anterior = ms;
      const segundos = Math.min(Math.max(intervalo, 0) / 1000, AVANCE_MAXIMO / HZ_DE_REFERENCIA);
      return { segundos, avance: segundos * HZ_DE_REFERENCIA };
    }
  };
}

/* Un lerp con factor fijo por cuadro tiene el mismo problema que un giro: a 60 Hz
   la cámara tarda el doble en llegar que a 120. Esta es la corrección conocida
   para interpolaciones exponenciales, y con avance = 1 devuelve exactamente el
   factor original, así que en la pantalla de referencia nada cambia. */
export function suavizado(factor, avance) {
  return 1 - Math.pow(1 - factor, avance);
}
