import { reactRouter } from "@react-router/dev/vite";

export default {
  /* Todo lo de esta app cuelga de /universo/, también sus assets.

     Por defecto el build los emite en /assets/ —la raíz del dominio—, que en
     producción es territorio de materias: nginx enruta por prefijo, así que
     esas peticiones irían a la otra app y volverían 404. El `basename` de las
     rutas no arregla esto; la ruta de los archivos es cosa de Vite.

     Se mueve el directorio de assets en vez de tocar `base`, que sería lo
     evidente: `base: "/universo/"` corta el build sin explicar por qué —el paso
     de prerender levanta un servidor de vista previa, y ahí React Router exige
     que el `basename` empiece por el `base`, cosa que "/universo" no hace con
     "/universo/"—, y sin la barra final concatena y salen rutas como
     «/universoassets/…». */
  build: { assetsDir: "universo/assets" },
  plugins: [reactRouter()],
  server: {
    /* El catálogo del cielo y los datos de los cuerpos viven todavía en
       sistema_solar/, fuera de esta app: mientras dure la convivencia hay que
       dejar que el servidor de desarrollo los lea. En el build no hace falta,
       porque se empaquetan. */
    fs: { allow: [".."] }
  }
};
