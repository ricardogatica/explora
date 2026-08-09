import { Ficha, NoExiste } from "../componentes.jsx";
import { fichaDe } from "../datos/fichas.js";
import { hermanosDe } from "../datos/vecinos.js";
import Escena from "../escena.jsx";

export function meta({ data, params }) {
  const ficha = fichaDe("solar", params.slug);
  return ficha
    ? [{ title: `${ficha.titulo} · Universo · Explora` }, { name: "description", content: ficha.descripcion }]
    : [{ title: "No encontrado · Universo · Explora" }];
}

export default function Pagina({ params }) {
  const ficha = fichaDe("solar", params.slug);
  if (!ficha) return <NoExiste que="un cuerpo" />;
  return (
    <Ficha ficha={ficha} hermanos={hermanosDe("solar", params.slug)}>
      <Escena cuerpo={params.slug} alto={460} />
    </Ficha>
  );
}
