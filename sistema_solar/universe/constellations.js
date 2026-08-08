/* Las 88 constelaciones.

   Los nombres en español y los hemisferios son contenido propio del proyecto y
   se conservan. Lo que cambia es el dibujo: antes cada constelación se trazaba
   con cuatro puntos inventados alrededor de una estrella ancla, y todas las
   estrellas de una constelación compartían su coordenada, así que la figura no
   se parecía a nada. Ahora las figuras son las de Stellarium y las posiciones
   las reales del catálogo HYG.

   Ver la cabecera de sky-catalog.js: ambas fuentes son CC BY-SA 4.0.
*/

import { FIGURA_POR_ABREVIATURA, SKY_BY_HIP } from "./sky.js";

/* [slug, nombre, hemisferio, abreviatura IAU, descripción propia si la tiene] */
const CATALOGO = [
  ["andromeda","Andrómeda","Norte","And"],
  ["antlia","Máquina Neumática","Sur","Ant"],
  ["apus","Ave del Paraíso","Sur","Aps"],
  ["aquarius","Acuario","Ecuatorial","Aqr"],
  ["aquila","Águila","Norte/Ecuatorial","Aql"],
  ["ara","Altar","Sur","Ara"],
  ["aries","Aries","Norte","Ari"],
  ["auriga","Cochero","Norte","Aur"],
  ["bootes","Boyero","Norte","Boo"],
  ["caelum","Buril","Sur","Cae"],
  ["camelopardalis","Jirafa","Norte","Cam"],
  ["cancer","Cáncer","Norte/Ecuatorial","Cnc"],
  ["canes-venatici","Perros de Caza","Norte","CVn"],
  ["canis-major","Can Mayor","Sur/Ecuatorial","CMa","Constelación donde se encuentra Sirio, la estrella más brillante del cielo nocturno. El trazo simplificado muestra cabeza, cuerpo y cola del Can Mayor."],
  ["canis-minor","Can Menor","Norte/Ecuatorial","CMi"],
  ["capricornus","Capricornio","Sur/Ecuatorial","Cap"],
  ["carina","Quilla","Sur","Car"],
  ["cassiopeia","Casiopea","Norte","Cas"],
  ["centaurus","Centauro","Sur","Cen"],
  ["cepheus","Cefeo","Norte","Cep"],
  ["cetus","Ballena","Ecuatorial","Cet"],
  ["chamaeleon","Camaleón","Sur","Cha"],
  ["circinus","Compás","Sur","Cir"],
  ["columba","Paloma","Sur","Col"],
  ["coma-berenices","Cabellera de Berenice","Norte","Com"],
  ["corona-australis","Corona Austral","Sur","CrA"],
  ["corona-borealis","Corona Boreal","Norte","CrB"],
  ["corvus","Cuervo","Sur/Ecuatorial","Crv"],
  ["crater","Copa","Sur/Ecuatorial","Crt"],
  ["crux","Cruz del Sur","Sur","Cru","Constelación pequeña pero emblemática del cielo austral, usada históricamente para orientación hacia el sur celeste."],
  ["cygnus","Cisne","Norte","Cyg"],
  ["delphinus","Delfín","Norte","Del"],
  ["dorado","Dorado","Sur","Dor"],
  ["draco","Dragón","Norte","Dra"],
  ["equuleus","Caballito","Norte","Equ"],
  ["eridanus","Erídano","Sur/Ecuatorial","Eri"],
  ["fornax","Horno","Sur","For"],
  ["gemini","Géminis","Norte/Ecuatorial","Gem"],
  ["grus","Grulla","Sur","Gru"],
  ["hercules","Hércules","Norte","Her"],
  ["horologium","Reloj","Sur","Hor"],
  ["hydra","Hidra","Sur/Ecuatorial","Hya"],
  ["hydrus","Hidra Macho","Sur","Hyi"],
  ["indus","Indio","Sur","Ind"],
  ["lacerta","Lagarto","Norte","Lac"],
  ["leo","Leo","Norte/Ecuatorial","Leo"],
  ["leo-minor","Leo Menor","Norte","LMi"],
  ["lepus","Liebre","Sur/Ecuatorial","Lep"],
  ["libra","Libra","Sur/Ecuatorial","Lib"],
  ["lupus","Lobo","Sur","Lup"],
  ["lynx","Lince","Norte","Lyn"],
  ["lyra","Lira","Norte","Lyr"],
  ["mensa","Mesa","Sur","Men"],
  ["microscopium","Microscopio","Sur","Mic"],
  ["monoceros","Unicornio","Ecuatorial","Mon"],
  ["musca","Mosca","Sur","Mus"],
  ["norma","Norma","Sur","Nor"],
  ["octans","Octante","Sur","Oct"],
  ["ophiuchus","Ofiuco","Ecuatorial","Oph"],
  ["orion","Orión","Ecuatorial","Ori","Constelación muy reconocible por sus estrellas brillantes y el cinturón de Orión. Su dibujo simplificado conecta hombros, cinturón y piernas."],
  ["pavo","Pavo","Sur","Pav"],
  ["pegasus","Pegaso","Norte","Peg"],
  ["perseus","Perseo","Norte","Per"],
  ["phoenix","Fénix","Sur","Phe"],
  ["pictor","Pintor","Sur","Pic"],
  ["pisces","Peces","Ecuatorial","Psc"],
  ["piscis-austrinus","Pez Austral","Sur","PsA"],
  ["puppis","Popa","Sur","Pup"],
  ["pyxis","Brújula","Sur","Pyx"],
  ["reticulum","Retículo","Sur","Ret"],
  ["sagitta","Flecha","Norte","Sge"],
  ["sagittarius","Sagitario","Sur/Ecuatorial","Sgr"],
  ["scorpius","Escorpio","Sur/Ecuatorial","Sco","Constelación marcada por Antares, una supergigante roja que destaca por su color intenso."],
  ["sculptor","Escultor","Sur","Scl"],
  ["scutum","Escudo","Ecuatorial","Sct"],
  ["serpens","Serpiente","Ecuatorial","Ser"],
  ["sextans","Sextante","Ecuatorial","Sex"],
  ["taurus","Tauro","Norte/Ecuatorial","Tau"],
  ["telescopium","Telescopio","Sur","Tel"],
  ["triangulum","Triángulo","Norte","Tri"],
  ["triangulum-australe","Triángulo Austral","Sur","TrA"],
  ["tucana","Tucán","Sur","Tuc"],
  ["ursa-major","Osa Mayor","Norte","UMa"],
  ["ursa-minor","Osa Menor","Norte","UMi"],
  ["vela","Vela","Sur","Vel"],
  ["virgo","Virgo","Ecuatorial","Vir"],
  ["volans","Pez Volador","Sur","Vol"],
  ["vulpecula","Zorra","Norte","Vul"]
];

/* Coordenadas de pantalla para la vista de constelaciones.

   La figura se centra en su propio cielo y se proyecta en un plano: se toma el
   centro de sus estrellas y se mide cada una respecto de él, corrigiendo la
   ascensión recta por el coseno de la declinación, que es lo que evita que las
   figuras cercanas a los polos salgan estiradas a lo ancho. */
function proyectar(estrellas) {
  const centroDec = estrellas.reduce((s, e) => s + e.dec, 0) / estrellas.length;
  // La ascensión recta da la vuelta en 24 h: se promedia por ángulo o una
  // constelación a caballo de las 0 h saldría partida en dos mitades opuestas.
  const angulo = estrellas.map(e => e.ra / 24 * Math.PI * 2);
  const centroRa = Math.atan2(
    angulo.reduce((s, a) => s + Math.sin(a), 0),
    angulo.reduce((s, a) => s + Math.cos(a), 0)
  ) / (Math.PI * 2) * 24;
  const cos = Math.cos(centroDec * Math.PI / 180);
  return estrellas.map(e => {
    let dRa = e.ra - centroRa;
    if (dRa > 12) dRa -= 24;
    if (dRa < -12) dRa += 24;
    return {
      estrella: e,
      // El signo invierte la ascensión recta porque el cielo se mira desde
      // dentro: al este queda a la izquierda.
      x: +(-dRa * 15 * cos * 0.24).toFixed(3),
      y: +((e.dec - centroDec) * 0.24).toFixed(3)
    };
  });
}

function construir([slug, name, hemisphere, abbr, descripcionPropia]) {
  const figura = FIGURA_POR_ABREVIATURA.get(abbr);
  const estrellas = figura.stars.map(hip => SKY_BY_HIP.get(hip));
  const proyectadas = proyectar(estrellas);
  const porHip = new Map(proyectadas.map(p => [p.estrella.hip, p]));

  const centroDec = estrellas.reduce((s, e) => s + e.dec, 0) / estrellas.length;
  const anguloRa = estrellas.map(e => e.ra / 24 * Math.PI * 2);
  const centroRa = Math.atan2(
    anguloRa.reduce((s, a) => s + Math.sin(a), 0),
    anguloRa.reduce((s, a) => s + Math.cos(a), 0)
  ) / (Math.PI * 2) * 24;

  return {
    slug, name, hemisphere, abbr,
    latin: figura.latin,
    ra: +((centroRa + 24) % 24).toFixed(3),
    dec: +centroDec.toFixed(3),
    visibleFrom: "first-stars",
    stars: estrellas.map(e => e.slug),
    description: descripcionPropia ??
      `${name} es una de las 88 constelaciones oficiales de la IAU. Su figura une ${estrellas.length} estrellas; la más brillante es ${[...estrellas].sort((a, b) => a.mag - b.mag)[0].name}.`,
    points: proyectadas.map(p => ({
      id: String(p.estrella.hip),
      starSlug: p.estrella.slug,
      name: p.estrella.name,
      x: p.x, y: p.y,
      size: +(0.12 + Math.max(0, (6.6 - p.estrella.mag)) * 0.055).toFixed(3),
      color: p.estrella.color,
      type: p.estrella.type,
      distance: p.estrella.ly ? `${p.estrella.ly} años luz` : "Distancia no determinada",
      distanceLy: p.estrella.ly,
      detail: `${p.estrella.type} de magnitud ${p.estrella.mag}.`
    })),
    lines: figura.lines.flatMap(linea =>
      linea.slice(1).map((hip, i) => [String(linea[i]), String(hip)])
        .filter(([a, b]) => porHip.has(Number(a)) && porHip.has(Number(b)))
    )
  };
}

export const CONSTELLATIONS = CATALOGO.map(construir);
export const CONSTELLATION_BY_SLUG = Object.fromEntries(CONSTELLATIONS.map(c => [c.slug, c]));
