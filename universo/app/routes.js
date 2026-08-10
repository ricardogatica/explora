import { index, route } from "@react-router/dev/routes";

/* Las URL son en español y sin .html: son las que va a ver la gente y las que
   va a indexar un buscador. Las viejas —star.html?slug=vega— redirigen desde
   nginx, que es donde toca hacerlo. */
export default [
  index("rutas/portada.jsx"),
  route("indice", "rutas/indice.jsx"),
  route("referencias", "rutas/referencias.jsx"),
  route("cuerpos/:slug", "rutas/cuerpo.jsx"),
  route("estrellas/:slug", "rutas/estrella.jsx"),
  route("constelaciones", "rutas/constelaciones.jsx"),
  route("constelaciones/:slug", "rutas/constelacion.jsx"),
  route("galaxias/:slug", "rutas/galaxia.jsx"),
  route("sistema-solar", "rutas/sistema-solar.jsx"),
  route("escala-planetaria", "rutas/escala-planetaria.jsx"),
  route("escala-de-soles", "rutas/escala-de-soles.jsx")
];
