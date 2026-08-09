import { reactRouter } from "@react-router/dev/vite";

export default {
  plugins: [reactRouter()],
  server: {
    /* El catálogo del cielo y los datos de los cuerpos viven todavía en
       sistema_solar/, fuera de esta app: mientras dure la convivencia hay que
       dejar que el servidor de desarrollo los lea. En el build no hace falta,
       porque se empaquetan. */
    fs: { allow: [".."] }
  }
};
