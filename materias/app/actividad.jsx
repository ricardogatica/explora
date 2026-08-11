import Potencias from "./actividades/potencias.jsx";

/* El despachador de actividades: del nombre escrito en un markdown al componente.

   Es un objeto y no un import dinámico porque con output: "export" todo se
   resuelve en el build, y un mapa explícito hace que una actividad sin componente
   sea imposible de pasar por alto. La lista de nombres válidos vive aparte, en
   actividades/nombres.js, porque el lector de contenido la necesita para validar
   sin poder importar JSX; una prueba comprueba que las dos coinciden. */
const ACTIVIDADES = {
  potencias: Potencias
};

export default function Actividad({ nombre, ...parametros }) {
  const Componente = ACTIVIDADES[nombre];

  /* No debería llegar aquí nunca: el build rompe antes si el nombre no existe.
     Se dice igualmente, porque un hueco en blanco en medio de una explicación es
     lo único peor que un mensaje de error. */
  if (!Componente) return <p className="vacio">No existe ninguna actividad llamada «{nombre}».</p>;

  return <Componente {...parametros} />;
}
