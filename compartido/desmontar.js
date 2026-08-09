/* Liberar lo que ocupa una escena 3D.

   Three.js no libera nada solo: las geometrías, los materiales y las texturas
   viven en la memoria de la tarjeta gráfica y solo se sueltan llamando a su
   `dispose()`. Mientras el sitio era un archivo HTML por página, cada navegación
   tiraba el documento entero y el navegador limpiaba por su cuenta. En una
   aplicación de una sola página eso ya no pasa: montar y desmontar ocho fichas
   de planetas deja ocho escenas enteras vivas.

   Y el aviso importa porque el fallo no avisa: no hay ningún error en consola.
   El navegador permite unos 16 contextos WebGL a la vez y al pasar de ahí
   descarta el más viejo en silencio. Lo que se ve es un canvas en negro, varias
   navegaciones después del error, sin nada en la consola que lo explique.

   Esta parte está separada del canvas a propósito: recorrer el grafo es donde
   se esconden los descuidos —el material que es un array, la textura que cuelga
   de un uniforme del shader— y aquí se puede probar con objetos falsos, sin
   necesitar una tarjeta gráfica. */

/* Las texturas de un material no están en una lista: son propiedades sueltas
   con nombres distintos según el tipo de material. Se recorren todas sus claves
   buscando cualquier cosa que sepa liberarse, en vez de mantener una lista de
   nombres que envejece en cuanto se usa un material nuevo. */
function liberarMaterial(material) {
  for (const valor of Object.values(material)) {
    if (valor && typeof valor === "object" && typeof valor.dispose === "function" && valor !== material) {
      valor.dispose();
    }
  }
  /* Los shaders propios guardan sus texturas dentro de uniformes, donde el
     barrido de arriba no llega: uniforms.uMapa.value. La superficie estelar del
     universo es justo eso. */
  for (const uniforme of Object.values(material.uniforms ?? {})) {
    const valor = uniforme?.value;
    if (valor && typeof valor.dispose === "function") valor.dispose();
  }
  material.dispose?.();
}

/* Recorre el grafo y libera todo lo que encuentra. Devuelve la cuenta de lo
   liberado, que es lo que permite comprobar en un test que no se saltó nada. */
export function liberarEscena(raiz) {
  const cuenta = { geometrias: 0, materiales: 0 };
  if (!raiz?.traverse) return cuenta;

  const vistos = new Set();
  raiz.traverse(objeto => {
    if (objeto.geometry && !vistos.has(objeto.geometry)) {
      vistos.add(objeto.geometry);
      objeto.geometry.dispose?.();
      cuenta.geometrias++;
    }
    // Un mesh puede tener varios materiales, uno por grupo de caras.
    const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    for (const material of materiales) {
      if (!material || vistos.has(material)) continue;
      vistos.add(material);
      liberarMaterial(material);
      cuenta.materiales++;
    }
  });

  // Vaciar el grafo: sin esto los objetos siguen referenciados desde la escena
  // aunque ya no ocupen memoria de vídeo.
  raiz.clear?.();
  return cuenta;
}
