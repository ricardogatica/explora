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
   se quedan en negro sin un solo error en la consola.

   Y el lienzo se crea aquí dentro, en cada montaje, en vez de venir del JSX. Ese
   desmontaje mata el contexto a propósito —es la única forma de devolverlo— y un
   lienzo al que se le mató el contexto no admite otro: `getContext` devuelve algo
   que parece válido pero está muerto, y three revienta con «Cannot read properties
   of null (reading 'precision')». Con el lienzo en el JSX, React reutiliza el mismo
   elemento al remontar y el segundo montaje se cae. Pasaba en desarrollo en cada
   recarga, porque React monta, desmonta y vuelve a montar para destapar justo esta
   clase de fallo. */

export default function Figura({ tipo, titulo, ...parametros }) {
  const contenedor = useRef(null);
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

    const lienzo = document.createElement("canvas");
    lienzo.className = "figura__lienzo";
    contenedor.current.append(lienzo);

    let escena;
    try {
      escena = montarEscena(lienzo, {
        fondo: null,             // transparente: la página ya tiene su papel
        camara: [2.6, 2.2, 3.4],
        alAnimar: ({ segundos }) => { figura.objeto.rotation.y += segundos * 0.35; }
      });
    } catch (fallo) {
      /* Una figura que no se puede dibujar no debería llevarse por delante la
         página entera: el texto que la rodea es la explicación, y la figura la
         acompaña. Sin esto, un navegador sin WebGL deja la ruta en una pantalla de
         error y no se puede leer nada. */
      lienzo.remove();
      setError("Esta figura necesita WebGL y este navegador no ha podido darlo.");
      console.error(fallo);
      return;
    }

    iluminar(escena.escena);
    escena.escena.add(figura.objeto);

    return () => {
      escena.desmontar();
      // El lienzo se va con la escena: su contexto ya no vale para nada.
      lienzo.remove();
    };
    // Los parámetros se comparan serializados: son números y cadenas sueltos, y
    // un objeto nuevo en cada render remontaría la escena en cada cuadro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, JSON.stringify(parametros)]);

  if (error) return <p className="vacio">{error}</p>;

  return (
    <figure className="figura">
      <div ref={contenedor} className="figura__caja" />
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
