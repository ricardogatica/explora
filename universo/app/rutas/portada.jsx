import { Link } from "react-router";
import { buildCatalog } from "../../../sistema_solar/nav-model.js";

export function meta() {
  return [
    { title: "Universo y Sistema Solar · Explora" },
    { name: "description", content: "El universo en 3D: planetas, estrellas, constelaciones y la historia desde el Big Bang." }
  ];
}

const CUENTAS = Object.fromEntries(buildCatalog().map(grupo => [grupo.id, grupo.entries.length]));

/* Portada del universo. Las escenas 3D todavía viven en el sitio anterior: esta
   página las enlaza mientras se convierten a montar/desmontar, que es el paso
   siguiente de esta fase. */
export default function Portada() {
  return (
    <main className="pagina">
      <p className="eyebrow">Explorador 3D educativo</p>
      <h1>Universo y Sistema Solar</h1>
      <p className="subtitle">
        Gira los planetas, viaja a las estrellas y recorre la historia desde el Big Bang.
        {" "}{CUENTAS.stars} estrellas con nombre propio, {CUENTAS.constellations} constelaciones
        y {CUENTAS.solar} cuerpos del sistema solar.
      </p>

      <div className="rejilla">
        <Link className="tarjeta" to="/indice">
          <strong>Índice del universo</strong>
          <span>Buscar entre todas las fichas</span>
        </Link>
        <Link className="tarjeta" to="/constelaciones">
          <strong>Constelaciones</strong>
          <span>Las 88 figuras, con sus estrellas reales</span>
        </Link>
        <Link className="tarjeta" to="/escala-planetaria">
          <strong>Escala planetaria</strong>
          <span>Los planetas por tamaño relativo</span>
        </Link>
        <Link className="tarjeta" to="/escala-de-soles">
          <strong>Escala de soles</strong>
          <span>De Próxima Centauri a Betelgeuse</span>
        </Link>
        <Link className="tarjeta" to="/referencias">
          <strong>Referencias</strong>
          <span>De dónde salen los datos</span>
        </Link>
      </div>
    </main>
  );
}
