"use client";

import { useState } from "react";
import {
  BASE_MINIMA, BASE_MAXIMA, EXPONENTE_MINIMO, EXPONENTE_MAXIMO,
  calcular, expansion, intercambiada, comoSeEscribe, escalones, enSuperindice
} from "./potencias-cuenta.js";

/* Una potencia con la que se puede jugar.

   Existe porque la diferencia entre cambiar la base y cambiar el exponente no se
   entiende leyéndola. Leído, «2⁵ y 5² son distintos» es una frase; movido, es una
   sorpresa: 32 contra 25, y gana el que parecía más pequeño.

   Lo que la hace didáctica y no un adorno es la escalera de abajo. Muestra el
   exponente de al lado en las dos direcciones, y con eso el exponente cero deja de
   ser una regla que hay que creerse: se llega a él dividiendo, igual que a todos
   los demás. Es la única forma que conozco de que a⁰ = 1 no parezca arbitrario.

   La aritmética vive en potencias-cuenta.js, en JavaScript llano, porque es lo que
   de verdad puede estar mal y aquí no se podría probar. Este archivo solo ata esos
   números a unos mandos. */

export default function Potencias({ base: baseInicial = 2, exponente: exponenteInicial = 5, titulo }) {
  const [base, setBase] = useState(Number(baseInicial));
  const [exponente, setExponente] = useState(Number(exponenteInicial));

  const potencia = calcular(base, exponente);
  const escrita = comoSeEscribe(base, exponente);
  const alReves = intercambiada(base, exponente);
  const pasos = escalones(base, exponente);

  return (
    <figure className="taller">
      <figcaption className="taller__titulo">
        {titulo ?? "Pruébalo: mueve la base y el exponente"}
      </figcaption>

      <div className="taller__mandos">
        <label className="mando">
          <span className="mando__nombre">Base <b>{base}</b></span>
          <input
            type="range" min={BASE_MINIMA} max={BASE_MAXIMA} step={1} value={base}
            onChange={evento => setBase(Number(evento.target.value))}
          />
          <span className="mando__pie">qué número se multiplica</span>
        </label>

        <label className="mando">
          <span className="mando__nombre">Exponente <b>{exponente}</b></span>
          <input
            type="range" min={EXPONENTE_MINIMO} max={EXPONENTE_MAXIMO} step={1} value={exponente}
            onChange={evento => setExponente(Number(evento.target.value))}
          />
          <span className="mando__pie">cuántas veces aparece</span>
        </label>
      </div>

      <p className="taller__cuenta">
        <span className="taller__potencia">{escrita}</span>
        <span className="taller__igual">=</span>
        <span className="taller__factores">{expansion(base, exponente)}</span>
        <span className="taller__igual">=</span>
        <output className="taller__valor">{potencia.escrito}</output>
      </p>

      {alReves && (
        /* Se dice cuál de las dos gana en lugar de sacar una moral general. La
           primera versión afirmaba que «el exponente pesa más que la base», y
           moviendo los mandos se ve que es falso: 10⁸ da cien millones y 8¹⁰ da
           mil setenta y tres millones. Lo único cierto para cualquier par es que
           intercambiarlos cambia el resultado. */
        <p className="taller__aviso">
          Intercambiarlos cambia el resultado: <b>{escrita} = {potencia.escrito}</b> y{" "}
          <b>{alReves.escrita} = {alReves.escrito}</b>
          {potencia.valor === alReves.valor
            ? ", que aquí coinciden."
            : `, así que gana ${potencia.valor > alReves.valor ? escrita : alReves.escrita}.`}
        </p>
      )}

      <div className="escalera">
        <span className="escalera__titulo">Cada paso multiplica o divide por {base}</span>
        <ol className="escalera__pasos">
          {pasos.map(paso => (
            <li key={paso.n} className={`escalon${paso.n === exponente ? " escalon--aqui" : ""}`}>
              <b>{base}{enSuperindice(paso.n)}</b>
              <span>{paso.escrito}</span>
            </li>
          ))}
        </ol>
        <span className="escalera__pie">
          {base === 1
            ? "Con base 1 todos los pasos valen 1: multiplicar por 1 no cambia nada."
            : `Bajando un escalón se divide por ${base}, y por eso ${base}⁰ = 1: es el escalón ` +
              `siguiente después de ${base}¹ = ${base}.`}
        </span>
      </div>
    </figure>
  );
}
