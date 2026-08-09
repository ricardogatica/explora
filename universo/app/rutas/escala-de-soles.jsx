import { Migas } from "../componentes.jsx";

export function meta() {
  return [{ title: "Escala de soles · Universo · Explora" }];
}

/* Sitio reservado: la escena 3D se monta aquí cuando se convierta a
   montar/desmontar. Mientras tanto la vista sigue funcionando en el sitio
   anterior y esta página lo dice, en vez de fingir que no existe. */
export default function Pagina() {
  return (
    <main className="pagina">
      <Migas tramos={[{ texto: "Escala de soles" }]} />
      <h1>Escala de soles</h1>
      <p className="vacio">
        Esta vista 3D todavía no se ha trasladado. Sigue disponible en la versión anterior
        del sitio mientras se convierte.
      </p>
    </main>
  );
}
