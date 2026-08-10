/* Dónde viven las texturas.

   Los datos de los cuerpos declaran rutas relativas —«textures/saturn/day.jpg»—
   porque en el sitio anterior cada ficha era un HTML dentro de sistema_solar/ y
   la ruta resolvía sola. Aquí las URLs son /universo/cuerpos/saturn, así que esa
   misma ruta relativa apunta a /universo/cuerpos/textures/… , que no existe.

   La primera vez que faltó este prefijo el anillo de Saturno desapareció sin
   más aviso que un 404 en la consola: la escena se dibuja igual, solo que sin
   anillo. Por eso el prefijo se pone en un único sitio y las tres escenas que
   leen texturas lo usan. */

export const BASE_TEXTURAS = "/universo/";

/* Devuelve el cuerpo con sus texturas resueltas contra la raíz de la app.
   Los cuerpos sin texturas —los que se pintan con color— pasan tal cual. */
export function conRutasDeTextura(cuerpo) {
  if (!cuerpo?.textures) return cuerpo;
  return {
    ...cuerpo,
    textures: Object.fromEntries(
      Object.entries(cuerpo.textures).map(([nombre, ruta]) => [nombre, BASE_TEXTURAS + ruta])
    )
  };
}

/* Para cuando solo hace falta una ruta suelta, no el cuerpo entero. */
export const rutaDeTextura = ruta => ruta && BASE_TEXTURAS + ruta;
