import { CONSTELLATIONS } from "./constellations.js";

const RAW_KNOWN_STARS = [
  {slug:"sirius",kind:"star",name:"Sirio",type:"Estrella binaria",constellation:"Can Mayor",visibleFrom:"first-stars",distance:"8,6 años luz",distanceLy:8.6,direction:[-0.58,0.14,-0.8],age:"≈242 Ma",color:0xbfdcff,size:5.0,description:"La estrella más brillante del cielo nocturno vista desde la Tierra; en realidad es un sistema binario.",behavior:"En la vista de universo actúa como referencia cercana y brillante: al acercarte se muestra como sistema estelar y no como planeta."},
  {slug:"vega",kind:"star",name:"Vega",type:"Estrella A",constellation:"Lira",visibleFrom:"first-stars",distance:"25 años luz",distanceLy:25,direction:[0.39,0.24,-0.89],age:"≈455 Ma",color:0xcfe8ff,size:4.2,description:"Estrella brillante del hemisferio norte y referencia histórica para calibraciones fotométricas.",behavior:"Se muestra como estrella blanca-azulada, útil para comparar brillo y color con otras estrellas conocidas."},
  {slug:"betelgeuse",kind:"star",name:"Betelgeuse",type:"Supergigante roja",constellation:"Orión",visibleFrom:"first-stars",distance:"≈550 años luz",distanceLy:550,direction:[-0.19,0.27,-0.94],age:"≈8–10 Ma",color:0xff8a55,size:9.4,description:"Supergigante roja evolucionada de Orión, mucho más grande que el Sol y en una etapa avanzada de vida estelar.",behavior:"Debe verse grande y rojiza: representa una estrella masiva envejecida con atmósfera extendida y variación de brillo."},
  {slug:"rigel",kind:"star",name:"Rigel",type:"Supergigante azul",constellation:"Orión",visibleFrom:"first-stars",distance:"≈860 años luz",distanceLy:860,direction:[-0.34,-0.1,-0.94],age:"≈8 Ma",color:0xb7d4ff,size:7.4,description:"Una de las estrellas más luminosas visibles a simple vista, ubicada en la constelación de Orión.",behavior:"Se visualiza como supergigante azul, más caliente en color que Betelgeuse y parte de la referencia de Orión."},
  {slug:"proxima-centauri",kind:"star",name:"Próxima Centauri",type:"Enana roja",constellation:"Centauro",visibleFrom:"first-stars",distance:"4,24 años luz",distanceLy:4.24,direction:[0.31,-0.24,-0.92],age:"≈4.850 Ma",color:0xff9b6d,size:4.2,description:"La estrella más cercana al Sol, parte del sistema Alfa Centauri y con al menos un planeta confirmado.",behavior:"Se presenta como enana roja cercana; su escala visual se amplifica para poder seleccionarla sin perder su detalle."},
  {slug:"polaris",kind:"star",name:"Polaris",type:"Supergigante amarilla",constellation:"Osa Menor",visibleFrom:"first-stars",distance:"≈447 años luz",distanceLy:447,direction:[0.08,0.44,-0.89],age:"≈70 Ma",color:0xffe7aa,size:5.8,description:"La Estrella Polar actual, cercana al polo norte celeste y útil para orientación.",behavior:"Funciona como marcador de orientación celeste y estrella variable de tipo cefeida."},
  {slug:"antares",kind:"star",name:"Antares",type:"Supergigante roja",constellation:"Escorpio",visibleFrom:"first-stars",distance:"≈550 años luz",distanceLy:550,direction:[0.55,-0.23,-0.8],age:"≈11 Ma",color:0xff7043,size:8.8,description:"Estrella rojiza muy luminosa en Escorpio, con un tamaño enorme comparado con el Sol.",behavior:"Se muestra como supergigante roja, comparable visualmente con Betelgeuse por color y evolución."},
  {slug:"acrux",kind:"star",name:"Acrux",type:"Sistema estelar múltiple",constellation:"Cruz del Sur",visibleFrom:"first-stars",distance:"≈320 años luz",distanceLy:320,direction:[-0.44,-0.27,-0.86],age:"≈10–20 Ma",color:0xb8d5ff,size:5.8,description:"La estrella más brillante de la Cruz del Sur, visible desde latitudes australes.",behavior:"Representa un sistema múltiple: se muestra como punto azul intenso asociado a la Cruz del Sur."},
  {slug:"ton-618",kind:"quasar",name:"TON 618",type:"Quásar hiperluminoso",constellation:"Canes Venatici / Coma Berenices",visibleFrom:"early-galaxies",distance:">10.000 millones de años luz de tiempo de viaje de la luz",distanceLy:10400000000,direction:[0.66,0.27,-0.7],age:"Luz emitida cuando el universo era joven",color:0xffd38a,size:14.0,redshift:"z ≈ 2,219",mass:"Más de 60.000 millones de masas solares",description:"TON 618 es un quásar extremadamente distante alimentado por un agujero negro ultramasivo. Su energía proviene de gas caliente en acreción alrededor del agujero negro central.",behavior:"En la vista del universo aparece como núcleo activo: disco de acreción brillante, halo y chorros relativistas. No pertenece al sistema solar; se activa al abrir el zoom cósmico."}
];

function distanceRadius(distanceLy){
  return Math.log10(distanceLy+1)*360;
}

function directionFromRaDec(raHours,decDeg){
  const ra=raHours/24*Math.PI*2,dec=decDeg*Math.PI/180;
  return [Math.cos(dec)*Math.sin(ra),Math.sin(dec),-Math.cos(dec)*Math.cos(ra)];
}

function scaledPosition(item){
  const radius=distanceRadius(item.distanceLy),direction=item.direction,mag=Math.hypot(...direction)||1;
  return direction.map(value=>value/mag*radius);
}

function generatedStarsFromConstellations(){
  const known=new Set(RAW_KNOWN_STARS.map(star=>star.slug)),items=[];
  CONSTELLATIONS.forEach(constellation=>{
    (constellation.points||[]).forEach(point=>{
      if(!point.starSlug||known.has(point.starSlug))return;
      known.add(point.starSlug);
      items.push({
        slug:point.starSlug,
        kind:"star",
        name:point.name,
        type:point.type||"Estrella principal",
        constellation:constellation.name,
        visibleFrom:constellation.visibleFrom||"first-stars",
        distance:point.distance||"Distancia aproximada no determinada",
        distanceLy:Number(point.distanceLy)||500,
        direction:directionFromRaDec(constellation.ra||0,constellation.dec||0),
        age:"Edad estelar no determinada en esta maqueta",
        color:point.color||0xdbeafe,
        size:Math.max(3.8,(point.size||.28)*8.2),
        file:`star.html?slug=${point.starSlug}`,
        description:`${point.name} es una estrella usada como punto de referencia de ${constellation.name}. En esta versión educativa se presenta con datos conocidos o aproximados para poder abrir su ficha y ubicarla dentro de la esfera celeste.`,
        behavior:`En la vista de constelaciones actúa como ancla visual de ${constellation.name}; en la vista del universo conserva la misma escala radial logarítmica por años luz.`
      });
    });
  });
  return items;
}

export const KNOWN_STARS = [...RAW_KNOWN_STARS,...generatedStarsFromConstellations()].map(item=>({
  ...item,
  file:item.file||`${item.slug}.html`,
  distanceScale:"Escala radial logarítmica en años luz",
  position:scaledPosition(item)
}));

export const KNOWN_STAR_BY_SLUG = Object.fromEntries(KNOWN_STARS.map(star=>[star.slug,star]));
