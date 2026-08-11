/* Revisar la cadena de conexión antes de usarla, para poder explicar el fallo.

   Esto existe por un rato perdido de verdad. En Railway la variable se pone como
   `${{Postgres.DATABASE_URL}}`, y con dos llaves de más al cerrar la referencia
   se resuelve igual pero deja las llaves pegadas al final: la cadena acaba en
   «…/railway}}». Postgres entonces dice, con toda la razón, que la base de datos
   «railway}}» no existe, y ese mensaje manda a buscar una base que falta cuando
   lo que hay es una llave sobrante. Con la pila de `pg` encima, cuesta ver que el
   nombre lleva basura.

   Lo que se comprueba es lo que se puede comprobar sin conectarse: que la
   variable está, que se parece a una URL de Postgres y que no lleva restos de una
   referencia sin resolver. Si algo está mal, el mensaje dice qué y cómo se
   arregla; si está bien, se calla y conecta. */

/** Devuelve una explicación del problema, o null si la cadena tiene buena pinta. */
export function revisarDatabaseUrl(cadena) {
  if (cadena === undefined || cadena === null || cadena.trim() === "") {
    return "Falta DATABASE_URL. En Railway se pone en el servicio de la API con el " +
      "valor ${{Postgres.DATABASE_URL}}; en local la pone infra/compose.yaml.";
  }

  const url = cadena.trim();

  /* Llaves, dólares o espacios en medio: la referencia de la plataforma no se
     resolvió, o se resolvió a medias. Es el caso que motivó todo esto. */
  if (/[{}]/.test(url)) {
    return `DATABASE_URL lleva llaves: «${resumir(url)}». La referencia a la base de ` +
      "datos se copió mal —lo normal es una llave de más al cerrar— y el nombre de la " +
      "base acaba con la basura pegada. Vuelve a ponerla como ${{Postgres.DATABASE_URL}}, " +
      "con dos llaves al abrir y dos al cerrar.";
  }

  if (url.startsWith("$")) {
    return `DATABASE_URL empieza por «$»: «${resumir(url)}». La plataforma no sustituyó ` +
      "la referencia, así que llegó el texto tal cual en vez de la dirección.";
  }

  if (!/^postgres(ql)?:\/\//.test(url)) {
    return `DATABASE_URL no parece una dirección de Postgres: «${resumir(url)}». ` +
      "Tiene que empezar por postgres:// o postgresql://.";
  }

  return null;
}

/* Un trozo reconocible sin publicar la contraseña en los registros, que en
   Railway son visibles para todo el equipo. */
function resumir(url) {
  const sinClave = url.replace(/\/\/[^@/]*@/, "//…@");
  return sinClave.length > 80 ? `${sinClave.slice(0, 77)}…` : sinClave;
}
