import { reactRouter } from "@react-router/dev/vite";

/* Todo lo de esta aplicación cuelga de /universo/, también sus archivos. Fuera
   de ese prefijo manda la aplicación de materias —nginx reparte así—, de modo
   que cualquier petición que se escape del prefijo aterriza en la otra
   aplicación y vuelve con un 404. El `basename` de las rutas no arregla esto:
   dice dónde viven las URL, no dónde viven los archivos.

   Se mueve el directorio de archivos y no se toca `base`, que sería lo
   evidente. Los dos intentos con `base` acaban mal:

   - "/universo/" corta el build sin explicar por qué. El prerender levanta un
     servidor de vista previa, y ahí React Router exige que el `basename`
     empiece por el `base`; "/universo" no empieza por "/universo/".
   - "/universo" se concatena sin separador y salen rutas como
     «/universoassets/…» y «/universo@react-router/critical.css».

   Poner la barra también en el `basename` pasa las dos comprobaciones, pero
   entonces los archivos se emiten en la raíz del build mientras sus URL dicen
   /universo/assets/: quedan en un sitio distinto del que anuncian.

   En desarrollo Vite sirve sus módulos internos desde la raíz. De eso se ocupa
   el proxy —ver tools/proxy-desarrollo.mjs—, que es quien hace de nginx ahí. */
export default {
  build: { assetsDir: "universo/assets" },
  plugins: [reactRouter()]
};
