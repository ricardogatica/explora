"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/* El buscador de páginas de una materia.

   Los dos sitios anteriores lo tenían en una barra lateral y era su forma
   principal de moverse: «usa el buscador del lado izquierdo», decía la portada.
   Quitarlo al migrar habría sido una regresión disfrazada de rediseño.

   Aquí SÍ se quitan las tildes para comparar, al revés que en la corrección de
   respuestas. Son decisiones opuestas a propósito: al corregir, la tilde es lo
   que se está enseñando; al buscar, escribir «acentuacion» sin tilde y no
   encontrar la página de acentuación es un castigo por escribir rápido. */
const normalizar = texto =>
  texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Buscador({ materia, paginas }) {
  const [consulta, setConsulta] = useState("");

  /* El texto sobre el que se busca se prepara una vez: incluye la categoría,
     así que buscar «ortografía» encuentra sus diez páginas aunque ninguna lleve
     esa palabra en el título. */
  const indexadas = useMemo(
    () => paginas.map(pagina => ({
      ...pagina,
      busqueda: normalizar([pagina.titulo, pagina.categoria, pagina.descripcion].join(" "))
    })),
    [paginas]
  );

  const termino = normalizar(consulta.trim());
  const encontradas = termino
    ? indexadas.filter(pagina => pagina.busqueda.includes(termino))
    : indexadas;

  const categorias = [...new Set(encontradas.map(p => p.categoria))];

  return (
    <>
      <div className="buscador">
        <input
          className="buscador__campo"
          type="search"
          value={consulta}
          onChange={evento => setConsulta(evento.target.value)}
          placeholder={`Buscar en ${materia.nombre.toLowerCase()}…`}
          aria-label={`Buscar una página de ${materia.nombre}`}
        />
        <span className="buscador__cuenta">
          {termino
            ? `${encontradas.length} de ${paginas.length} páginas`
            : `${paginas.length} páginas`}
        </span>
      </div>

      {encontradas.length === 0 ? (
        <p className="vacio">
          No hay ninguna página que hable de «{consulta.trim()}». Prueba con otra palabra.
        </p>
      ) : (
        categorias.map(categoria => (
          <section key={categoria}>
            <h2>{categoria}</h2>
            <div className="rejilla">
              {encontradas.filter(p => p.categoria === categoria).map(pagina => (
                <Link key={pagina.id} className="tarjeta" href={`/${materia.slug}/${pagina.id}/`}>
                  <strong>{pagina.titulo}</strong>
                  <span>{pagina.descripcion}</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
