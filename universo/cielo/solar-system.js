export const BODY_ORDER = ["sun","mercury","venus","earth","mars","jupiter","saturn","uranus","neptune"];

export const TIMELINE_EVENTS = [
  {id:"big-bang",name:"Big Bang",time:"13.800 Ma",zoom:100,earthStage:"none",desc:"Comienza la expansión del universo. Aún no hay estrellas, planetas ni sistema solar."},
  {id:"inflation",name:"Inflación",time:"Instantes iniciales",zoom:99,earthStage:"none",desc:"El espacio se expande de forma extrema; pequeñas fluctuaciones cuánticas quedan sembradas en el universo."},
  {id:"cosmic-background",name:"Radiación cósmica de fondo",time:"≈380.000 años",zoom:98,earthStage:"none",desc:"El universo se enfría lo suficiente para que la luz viaje libremente: queda el brillo fósil del Big Bang."},
  {id:"dark-ages",name:"Edad oscura",time:"380.000–400 Ma",zoom:97,earthStage:"none",desc:"Aún no existen estrellas. El universo contiene gas, materia oscura y regiones que empiezan a colapsar."},
  {id:"first-stars",name:"Primeras estrellas",time:"≈400 Ma",zoom:96,earthStage:"none",desc:"Nacen las primeras estrellas masivas y fabrican elementos más pesados, base futura de planetas rocosos."},
  {id:"early-galaxies",name:"Primeras galaxias",time:"13.300 Ma",zoom:92,earthStage:"none",desc:"Cúmulos de estrellas y gas se agrupan en galaxias jóvenes dentro de la expansión cósmica."},
  {id:"early-milky-way",name:"Vía Láctea temprana",time:"13.200 Ma",zoom:88,earthStage:"none",desc:"La galaxia se organiza y crece mediante nubes de gas y fusiones con estructuras menores."},
  {id:"solar-system-formation",name:"Formación del Sistema Solar",time:"4.600 Ma",zoom:72,earthStage:"molten",desc:"Una supernova cercana pudo comprimir la nebulosa: colapsa, nace el Sol y el disco forma planetesimales."},
  {id:"earth-formation",name:"Formación de la Tierra",time:"4.540 Ma",zoom:58,earthStage:"molten",desc:"La Tierra joven es un mundo caliente, con superficie inestable y frecuentes impactos."},
  {id:"moon-formation",name:"Formación de la Luna",time:"≈4.510 Ma",zoom:52,earthStage:"molten",desc:"Un gran impacto con la Tierra temprana genera escombros que terminan formando la Luna."},
  {id:"early-oceans",name:"Océanos tempranos",time:"4.000–3.500 Ma",zoom:42,earthStage:"archaean",desc:"Se enfría la corteza y aparecen océanos tempranos. La vida microbiana podría comenzar en este contexto."},
  {id:"great-oxidation",name:"Gran Oxidación",time:"≈2.400 Ma",zoom:35,earthStage:"proterozoic",desc:"La actividad microbiana libera oxígeno y transforma gradualmente la química del planeta."},
  {id:"complex-life",name:"Vida compleja",time:"541 Ma",zoom:28,earthStage:"paleozoic",desc:"Explota la diversidad biológica. Surgen muchos linajes animales y ecosistemas complejos."},
  {id:"pangaea",name:"Pangea ensamblada",time:"335–250 Ma",zoom:20,earthStage:"pangaea",desc:"Los continentes forman el supercontinente Pangea, rodeado por el gran océano Panthalassa."},
  {id:"pangaea-breakup",name:"Pangea comienza a separarse",time:"200–175 Ma",zoom:16,earthStage:"breakup1",desc:"Pangea inicia su fragmentación en grandes masas: Laurasia al norte y Gondwana al sur."},
  {id:"advanced-breakup",name:"Separación avanzada",time:"145–100 Ma",zoom:12,earthStage:"breakup2",desc:"Atlántico en expansión, India se desplaza al norte y los continentes toman formas más reconocibles."},
  {id:"modern-continents",name:"Continentes modernos",time:"66 Ma–hoy",zoom:8,earthStage:"modern",desc:"La tectónica sigue activa, pero la configuración se parece mucho más a la geografía actual."},
  {id:"today",name:"Hoy",time:"Presente",zoom:5,earthStage:"modern",desc:"La Tierra actual presenta continentes, océanos, atmósfera oxigenada, clima activo y vida compleja."}
];

/* Cuánto se frena el giro de los cuerpos sobre su eje.

   Sin frenar, Júpiter daba una vuelta cada 19 segundos y la Tierra cada 31:
   demasiado para observar la superficie, y mareante junto al giro de cámara.
   Con 4 la Tierra tarda unos dos minutos, que deja mirar sin prisa y sigue
   dejando claro que el planeta rota.

   Las velocidades relativas entre cuerpos no se tocan: siguen ordenadas como
   los días reales, con Júpiter el más rápido y Venus el más lento. */
export const ROTATION_SLOWDOWN = 4;

/* Las lunas se frenan el doble que la rotación de los cuerpos.

   Con solo el factor de rotación, Ío daba una vuelta a Júpiter en 23 segundos:
   una luna cruzando la pantalla a esa velocidad se lee como un satélite
   artificial, no como un mundo. Con 8, Ío tarda unos 46 segundos y Calisto
   casi tres minutos, que además conserva el orden real —las interiores más
   rápidas que las exteriores, como manda Kepler—. */
export const SATELLITE_SLOWDOWN = 8;

export const SOLAR_SYSTEM_BEHAVIOR = {
  /* Hasta 140.000: es lo que hace falta para que alejarse acabe enseñando la Vía
     Láctea entera, que es lo que uno espera al arrastrar la barra hasta el final.
     La curva ya no se usa —el recorrido es logarítmico, ver setZoom— y se deja
     fuera para que nadie la ajuste creyendo que hace algo. */
  zoomDistance:{min:6,max:140000},
  initialZoom:18,
  initialFocusDistance:7,
  orbitPhaseStep:0.45,
  focusedOrbitScale:2.35,
  zoomOrbitScale:1.65,
  orbitScaleLerp:0.06,
  galaxyVisibilityZoom:0.4
};

export const TIMELINE_INDEX_BY_ID = Object.fromEntries(TIMELINE_EVENTS.map((event,index)=>[event.id,index]));

function orbitInclination(index=0){
  return [-0.18,-0.12,-0.06,0.02,0.08,0.14,0.2,0.26,0.32][index]??0;
}

export function getOrbitPosition(body,time,index=0,orbitScale=1){
  if(body.orbitRadius===0)return{x:0,y:0,z:0};
  const angle=time*body.orbitSpeed+index*SOLAR_SYSTEM_BEHAVIOR.orbitPhaseStep;
  const radius=body.orbitRadius*orbitScale;
  const inclination=orbitInclination(index);
  return{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*inclination+index*0.08,z:Math.sin(angle)*radius};
}

export function getMoonOrbitPosition(moon,time,scale=1){
  const angle=time*moon.orbitSpeed*scale;
  return{x:Math.cos(angle)*moon.orbitRadius,y:Math.sin(angle)*moon.orbitRadius*0.22,z:Math.sin(angle)*moon.orbitRadius};
}
