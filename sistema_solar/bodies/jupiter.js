export const jupiter = {
  slug:"jupiter",type:"Gigante gaseoso",name:"Júpiter",color:0xd5ad72,radius:0.95,orbitRadius:16.8,orbitSpeed:0.0052,rotationSpeed:0.0026,gravity:"24,79 m/s²",gravityFactor:"2,53 g",diameter:"139.820 km",distance:"778,5 millones km",year:"11,86 años",day:"9,9 horas",temperature:"≈ -145 °C",moons:"95+",
  description:"Júpiter es el planeta más grande del sistema solar. Su enorme masa influye gravitacionalmente en muchos cuerpos menores.",
  interaction:"Actúa como un gran dominador gravitacional regional. Su gravedad afecta cinturones de asteroides y familias de cometas.",
  visibleFrom:"solar-system-formation",
  satellites:[
    {name:"Ío",type:"Luna galileana volcánica",diameter:"3.643 km",distance:"421.700 km",radius:0.105,orbitRadius:1.72,orbitSpeed:0.018,color:0xf0cf74,description:"El mundo volcánicamente más activo del sistema solar, calentado por mareas gravitacionales."},
    {name:"Europa",type:"Luna galileana helada",diameter:"3.122 km",distance:"671.100 km",radius:0.095,orbitRadius:2.25,orbitSpeed:0.012,color:0xd8d5c8,description:"Corteza de hielo con un océano subterráneo probable, uno de los lugares clave para estudiar habitabilidad."},
    {name:"Ganímedes",type:"Luna galileana mayor",diameter:"5.268 km",distance:"1.070.400 km",radius:0.15,orbitRadius:2.95,orbitSpeed:0.008,color:0xb7a58d,description:"La luna más grande del sistema solar; incluso supera en tamaño a Mercurio."},
    {name:"Calisto",type:"Luna galileana exterior",diameter:"4.821 km",distance:"1.882.700 km",radius:0.14,orbitRadius:3.8,orbitSpeed:0.005,color:0x8f8272,description:"Mundo antiguo y craterizado que conserva una superficie muy poco renovada."}
  ],
  textures:{day:"textures/jupiter/day.jpg"},
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"El hidrógeno y helio existen, pero Júpiter como planeta todavía no."},
    {from:"solar-system-formation",state:"gas-accretion",title:"Crecimiento rápido",description:"Captura gas del disco solar y se convierte en el planeta dominante del sistema."},
    {from:"today",state:"modern",title:"Júpiter actual",description:"Gigante gaseoso con bandas, tormentas y un sistema complejo de lunas."}
  ],
  history:[
    {time:"13.800 Ma",title:"Hidrógeno y helio",text:"Los gases dominantes de Júpiter proceden directamente de la química temprana del universo."},
    {time:"4.600 Ma",title:"Crecimiento rápido",text:"Probablemente formó un núcleo masivo temprano y capturó grandes cantidades de gas del disco solar."},
    {time:"Presente",title:"Sistema joviano",text:"Sus bandas, tormentas y lunas forman un sistema dinámico dentro del sistema solar."}
  ]
};
