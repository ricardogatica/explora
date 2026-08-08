/* Exportación estática: no hay nada en Explora que necesite un servidor —sin
   cuentas, sin persistencia, sin formularios—, así que el build produce archivos
   que nginx sirve y en producción no hay proceso Node que mantener.

   Consecuencia que hay que tener presente: con `output: "export"` todas las
   rutas dinámicas deben enumerarse con generateStaticParams. Para un sitio
   generado desde archivos es lo natural.

   Sin `basePath`: esta app posee /matematicas, /lenguaje, /ciencias… como rutas
   propias, así que vive en la raíz del dominio. El proxy le manda todo salvo
   /universo. El prefijo solo lo necesita el sistema solar. */
export default {
  output: "export",
  // Las URLs terminan en / y cada página es su propio index.html: es lo que
  // espera nginx sirviendo un directorio sin reglas de reescritura.
  trailingSlash: true
};
