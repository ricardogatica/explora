import { Ficha, NoExiste } from "../componentes.jsx";
import { fichaDe } from "../datos/fichas.js";
import { hermanosDe } from "../datos/vecinos.js";

export function meta({ data, params }) {
  const ficha = fichaDe("galaxies", params.slug);
  return ficha
    ? [{ title: `${ficha.titulo} · Universo · Explora` }, { name: "description", content: ficha.descripcion }]
    : [{ title: "No encontrado · Universo · Explora" }];
}

export default function Pagina({ params }) {
  const ficha = fichaDe("galaxies", params.slug);
  if (!ficha) return <NoExiste que="una galaxia" />;
  return <Ficha ficha={ficha} hermanos={hermanosDe("galaxies", params.slug)} />;
}
