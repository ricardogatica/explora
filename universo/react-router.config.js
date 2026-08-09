/* El universo se publica como archivos, no como servidor.

   `ssr: false` con `prerender` genera un HTML por ruta: es lo que convierte las
   415 fichas en páginas de verdad. Hoy 400 estrellas comparten
   star.html?slug=… —un archivo, ninguna URL propia, invisibles para un
   buscador— y ese era el único motivo de peso para traer un framework aquí.

   `basename` porque detrás del proxy esta app vive bajo /universo, mientras que
   las materias ocupan la raíz del dominio. */
export default {
  ssr: false,
  basename: "/universo",
  async prerender() {
    const { rutasParaPrerenderizar } = await import("./app/datos/rutas.js");
    return rutasParaPrerenderizar();
  }
};
