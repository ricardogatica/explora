import Link from "next/link";

/* Migas de pan. La ruta de aprendizaje cruza materias, así que sin ellas es fácil
   perder de vista si se está dentro de una asignatura o dentro de un tramo de
   edad. */
export default function Migas({ tramos }) {
  return (
    <nav className="crumbs" aria-label="Ruta de navegación">
      <Link href="/">Explora</Link>
      {tramos.map(tramo => (
        <span key={tramo.texto}>
          {" › "}
          {tramo.href ? <Link href={tramo.href}>{tramo.texto}</Link> : <span aria-current="page">{tramo.texto}</span>}
        </span>
      ))}
    </nav>
  );
}
