export const sun = {
  slug:"sun",type:"Estrella",name:"Sol",color:0xffcc55,radius:1.6,orbitRadius:0,orbitSpeed:0,rotationSpeed:0.0009,gravity:"274 m/s²",gravityFactor:"27,94 g",diameter:"1.392.700 km",distance:"0 km",year:"—",day:"~27 días",temperature:"≈ 5.500 °C (superficie)",moons:"No aplica",
  description:"El Sol concentra casi toda la masa del sistema solar. Su gravedad mantiene a los planetas, asteroides y cometas en órbita. Produce energía por fusión nuclear en su núcleo.",
  interaction:"La gravedad solar domina el sistema. Cada planeta acelera o desacelera según su distancia y velocidad orbital alrededor del Sol.",
  visibleFrom:"solar-system-formation",
  // Emite su propia luz: material sin iluminación, o saldría a oscuras.
  emissive:true,
  textures:{day:"textures/sun/day.jpg"},
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"En el Big Bang solo están los ingredientes iniciales; el Sol aparecerá miles de millones de años después."},
    {from:"solar-system-formation",state:"formed",title:"Proto-Sol",description:"Una onda de choque pudo comprimir la nebulosa; al colapsar, más del 99% de la masa cayó al centro, encendió el Sol joven y dejó un disco donde polvo y hielo empezaron a formar planetesimales."},
    {from:"today",state:"modern",title:"Sol actual",description:"Estrella estable de secuencia principal que sostiene dinámicamente al sistema solar."}
  ],
  history:[
    {time:"13.800 Ma",title:"Origen cósmico",text:"El Big Bang inicia la expansión del universo y produce hidrógeno y helio, materia prima de futuras estrellas."},
    {time:"4.600 Ma",title:"Nacimiento del Sol",text:"Una nube molecular enriquecida por estrellas anteriores colapsa y enciende la fusión nuclear en el proto-Sol."},
    {time:"Presente",title:"Secuencia principal",text:"El Sol se mantiene estable fusionando hidrógeno; su luz y viento solar modelan el entorno planetario."}
  ]
};
