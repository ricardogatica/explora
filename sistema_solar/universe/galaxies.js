export const KNOWN_GALAXIES = [
  {
    slug:"milky-way",
    kind:"galaxy",
    name:"Vía Láctea",
    type:"Galaxia espiral barrada",
    visibleFrom:"early-milky-way",
    distance:"0 años luz: estamos dentro de ella",
    distanceLy:0,
    distanceScale:"Referencia central de la escala galáctica local",
    diameter:"≈100.000 años luz",
    age:"≈13.000 millones de años",
    constellation:"Grupo Local",
    region:"Brazo de Orión",
    position:[0,-52,-780],
    size:120,
    description:"La Vía Láctea es la galaxia espiral barrada que contiene al Sistema Solar. Su disco combina brazos espirales, gas, polvo, cúmulos estelares y un bulbo central alrededor de un agujero negro supermasivo.",
    behavior:"En el universo funciona como estructura contenedora: las estrellas cercanas se distribuyen dentro de su escala y el Sistema Solar queda como un punto local en el brazo de Orión. En detalle se muestra su disco espiral, barra central, halo estelar y rotación diferencial.",
    file:"milky-way.html"
  }
];

export const KNOWN_GALAXY_BY_SLUG = Object.fromEntries(KNOWN_GALAXIES.map(galaxy=>[galaxy.slug,galaxy]));
