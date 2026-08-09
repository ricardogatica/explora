"use client";

import { useEffect, useRef, useState } from "react";
import { montarEscena } from "@explora/compartido/canvas.js";
import { crearFigura, iluminar } from "@explora/compartido/primitivas.js";

/* Una figura 3D dentro de una página.

   El andamiaje —crear el renderer, redimensionar, y sobre todo desmontar— vive
   en @explora/compartido, en JavaScript llano, porque el universo lo usará
   igual y no es de React. Aquí solo se ata al ciclo de vida del componente.

   La función que devuelve `useEffect` es lo que impide la fuga: sin ella, cada
   figura por la que se navega deja su escena en la memoria de la tarjeta
   gráfica, y al pasar de los ~16 contextos que permite el navegador los canvas
   se quedan en negro sin un solo error en la consola. */

export default function Figura({ tipo, titulo, ...parametros }) {
  const lienzo = useRef(null);
  const [error, setError] = useState(null);
  const [medidas, setMedidas] = useState([]);

  useEffect(() => {
    const figura = crearFigura(tipo, parametros);
    if (!figura) {
      // El nombre viene escrito a mano en un markdown: decirlo es más útil que
      // dejar un hueco en blanco que nadie sabe interpretar.
      setError(`No existe ninguna figura llamada «${tipo}».`);
      return;
    }
    setMedidas(figura.medidas);

    const escena = montarEscena(lienzo.current, {
      fondo: null,             // transparente: la página ya tiene su papel
      camara: [2.6, 2.2, 3.4],
      alAnimar: ({ segundos }) => { figura.objeto.rotation.y += segundos * 0.35; }
    });
    iluminar(escena.escena);
    escena.escena.add(figura.objeto);

    return escena.desmontar;
    // Los parámetros se comparan serializados: son números y cadenas sueltos, y
    // un objeto nuevo en cada render remontaría la escena en cada cuadro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, JSON.stringify(parametros)]);

  if (error) return <p className="vacio">{error}</p>;

  return (
    <figure className="figura">
      <canvas ref={lienzo} className="figura__lienzo" />
      <figcaption className="figura__pie">
        {titulo && <strong>{titulo}</strong>}
        <dl className="figura__medidas">
          {medidas.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt>{etiqueta}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
        <span className="figura__ayuda">Arrastra para girarla</span>
      </figcaption>
    </figure>
  );
}
