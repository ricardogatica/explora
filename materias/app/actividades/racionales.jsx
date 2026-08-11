"use client";

import { useState } from "react";
import {
  MINIMO, MAXIMO, simplificar, esIrreducible, decimalDe, comoMixto
} from "./racionales-cuenta.js";

/* Construir una fracción y ver qué sale.

   Los dos mandos no son intercambiables y esa es la idea: el de abajo dice en
   cuántos trozos se corta y el de arriba cuántos se toman. Movido, se ve que subir
   el denominador hace los trozos más pequeños —y por tanto la fracción menor—, que
   es justo lo contrario de lo que sugiere «el número es más grande».

   La barra está dividida de verdad en `denominador` partes. No es decoración: es la
   única representación en la que 3/4 y 6/8 se ven iguales por dentro y distintos por
   fuera, que es lo que significa «equivalentes».

   El decimal se calcula por división larga en racionales-cuenta.js, no con la
   división de JavaScript: 1/3 en punto flotante da dieciséis treses y termina, y lo
   que esta página enseña es precisamente que no termina. */

export default function Racionales({ numerador: n = 3, denominador: d = 4, titulo }) {
  const [numerador, setNumerador] = useState(Number(n));
  const [denominador, setDenominador] = useState(Number(d));

  const decimal = decimalDe(numerador, denominador);
  const simple = simplificar(numerador, denominador);
  const yaSimple = esIrreducible(numerador, denominador);
  const mixto = comoMixto(numerador, denominador);

  /* Si se toman más trozos de los que hay, se necesita más de una barra entera. Se
     dibujan las que hagan falta en vez de recortar: 7/4 son una barra llena y tres
     cuartos de la siguiente, y verlo es entender qué es una fracción impropia. */
  const barras = Math.max(1, Math.ceil(numerador / denominador) || 1);
  const trozos = Array.from({ length: barras * denominador }, (_, i) => i < numerador);

  return (
    <figure className="taller">
      <figcaption className="taller__titulo">
        {titulo ?? "Constrúyela: cuántos trozos tomas, y de cuántos"}
      </figcaption>

      <div className="taller__mandos">
        <label className="mando">
          <span className="mando__nombre">Numerador <b>{numerador}</b></span>
          <input
            type="range" min={MINIMO} max={MAXIMO} step={1} value={numerador}
            onChange={evento => setNumerador(Number(evento.target.value))}
          />
          <span className="mando__pie">cuántos trozos se toman</span>
        </label>

        <label className="mando">
          <span className="mando__nombre">Denominador <b>{denominador}</b></span>
          <input
            type="range" min={1} max={MAXIMO} step={1} value={denominador}
            onChange={evento => setDenominador(Number(evento.target.value))}
          />
          <span className="mando__pie">en cuántos se corta el entero</span>
        </label>
      </div>

      <p className="taller__cuenta">
        <span className="fraccion">
          <b>{numerador}</b>
          <i />
          <b>{denominador}</b>
        </span>
        <span className="taller__igual">=</span>
        <output className="taller__valor">
          {decimal.entera}
          {(!decimal.exacto || decimal.fijas) && ","}
          {decimal.fijas}
          {decimal.periodo && <span className="periodo" title="esta parte se repite para siempre">{decimal.periodo}</span>}
          {!decimal.exacto && "…"}
        </output>
      </p>

      <div className="barras" aria-hidden="true">
        {Array.from({ length: barras }, (_, fila) => (
          <div key={fila} className="barra">
            {trozos.slice(fila * denominador, (fila + 1) * denominador).map((lleno, i) => (
              <i key={i} className={lleno ? "es-lleno" : ""} />
            ))}
          </div>
        ))}
      </div>

      <ul className="notas">
        <li>
          {decimal.exacto
            ? <>Su decimal <b>termina</b>: {denominador === 1 ? "es un número entero" : `${numerador} dividido entre ${denominador} da una división exacta`}.</>
            : <>Su decimal <b>no termina</b>: el {decimal.periodo} se repite para siempre. Por eso se escribe con el periodo marcado y no con muchos decimales.</>}
        </li>
        {/* Con cero trozos, «es lo mismo que 0/1» es cierto y no aclara nada: lo que
            hay que decir es que cero de lo que sea es cero, y eso lo dice la nota de
            más abajo. */}
        {numerador !== 0 && (
          <li>
            {yaSimple
              ? <>Ya está en su forma más simple: no hay ningún número que divida arriba y abajo.</>
              : <>Es la misma cantidad que <b>{simple.numerador}/{simple.denominador}</b>. Mira la barra: cambian los cortes, no lo pintado.</>}
          </li>
        )}
        {mixto && (
          <li>
            Es más de un entero: <b>{mixto.entera}</b> {mixto.entera === 1 ? "entero" : "enteros"}
            {mixto.numerador > 0 && <> y <b>{mixto.numerador}/{mixto.denominador}</b></>}.
          </li>
        )}
        {numerador === 0 && <li>Cero trozos de lo que sea son cero. Por eso 0/{denominador} = 0.</li>}
        {denominador === 1 && <li>Cortar en una sola parte es no cortar: todo entero es también una fracción.</li>}
      </ul>
    </figure>
  );
}
