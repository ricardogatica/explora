import { Ficha, NoExiste } from "../componentes.jsx";
import { fichaDe } from "../datos/fichas.js";
import { hermanosDe } from "../datos/vecinos.js";
import Escena from "../escena.jsx";
import { KNOWN_STAR_BY_SLUG } from "../../cielo/data.js";

export function meta({ data, params }) {
  const ficha = fichaDe("stars", params.slug);
  return ficha
    ? [{ title: `${ficha.titulo} · Universo · Explora` }, { name: "description", content: ficha.descripcion }]
    : [{ title: "No encontrado · Universo · Explora" }];
}

export default function Pagina({ params }) {
  const ficha = fichaDe("stars", params.slug);
  if (!ficha) return <NoExiste que="una estrella" />;
  const objeto = KNOWN_STAR_BY_SLUG[params.slug];
  return (
    <Ficha ficha={ficha} hermanos={hermanosDe("stars", params.slug)}>
      {/* Debajo del título y la descripción, como pidió quien lo va a usar. */}
      {objeto && <Escena objeto={objeto} alto={420} />}
    </Ficha>
  );
}
