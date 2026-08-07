export const moon = {
  slug:"moon",parent:"earth",type:"Satélite natural",name:"Luna",color:0xd2d0cb,radius:0.14,orbitRadius:1.0,orbitSpeed:0.028,rotationSpeed:0.0009,gravity:"1,62 m/s²",gravityFactor:"0,165 g",diameter:"3.474 km",distance:"384.400 km de la Tierra",year:"27,3 días alrededor de la Tierra",day:"27,3 días",temperature:"-173 a 127 °C",moons:"0",
  description:"La Luna es el satélite natural de la Tierra. Está acoplada por marea, por eso siempre muestra casi la misma cara a nuestro planeta.",
  interaction:"Su gravedad produce mareas oceánicas y ayuda a estabilizar la inclinación del eje terrestre.",
  visibleFrom:"moon-formation",
  textures:{day:"textures/moon/day.jpg"},
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"La Luna aparece después de la Tierra temprana."},
    {from:"moon-formation",state:"forming",title:"Impacto gigante",description:"Escombros en órbita alrededor de la Tierra se agregan y forman la Luna."},
    {from:"early-oceans",state:"young",title:"Luna temprana",description:"La Luna ya acompaña a la Tierra y modula mareas en un planeta joven."},
    {from:"today",state:"modern",title:"Luna actual",description:"Satélite acoplado por marea que sigue alejándose lentamente de la Tierra."}
  ],
  history:[
    {time:"13.800 Ma",title:"Materia del universo temprano",text:"La materia que formará la Luna pasa por generaciones de estrellas antes de incorporarse al sistema solar."},
    {time:"≈4.510 Ma",title:"Impacto gigante",text:"El escenario principal propone que la Luna se forma a partir de escombros tras un gran impacto con la Tierra joven."},
    {time:"Presente",title:"Acoplamiento de marea",text:"La Luna mantiene una rotación sincronizada y continúa alejándose lentamente de la Tierra."}
  ]
};
