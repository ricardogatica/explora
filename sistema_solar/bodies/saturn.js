export const saturn = {
  slug:"saturn",type:"Gigante gaseoso",name:"Saturno",color:0xe4d39e,radius:0.86,orbitRadius:22.5,orbitSpeed:0.0039,rotationSpeed:0.0022,gravity:"10,44 m/s²",gravityFactor:"1,07 g",diameter:"116.460 km",distance:"1.433 millones km",year:"29,45 años",day:"10,7 horas",temperature:"≈ -178 °C",moons:"140+",
  description:"Saturno es famoso por su sistema de anillos, compuesto por hielo, roca y polvo distribuido en bandas.",
  interaction:"Los anillos y sus lunas se moldean mediante resonancias orbitales y la gravedad del planeta.",
  visibleFrom:"solar-system-formation",
  /* Las seis lunas mayores, de las más de 140 catalogadas. Se dejan fuera
     Jápeto y las pequeñas irregulares: Jápeto orbita a 3,56 millones de km,
     diecinueve veces más lejos que Mimas, y meterlo obligaría a alejar tanto
     la cámara que Saturno quedaría en un punto.

     Los diámetros y distancias de los datos son los reales. Lo que está
     comprimido es la representación, como en Júpiter: las órbitas se acercan
     para que el sistema quepa en pantalla, y las lunas menores se dibujan algo
     más grandes de lo que les tocaría o serían invisibles. Mimas mide 396 km
     frente a los 120.536 de Saturno: a escala honesta sería medio píxel.

     Las velocidades conservan el orden real, con las interiores más rápidas:
     Mimas da una vuelta en 0,94 días y Titán en 15,95. */
  satellites:[
    {name:"Mimas",type:"Luna helada con el cráter Herschel",diameter:"396 km",distance:"185.500 km",
     radius:0.030,orbitRadius:2.15,orbitSpeed:0.024,color:0xcfd3d8,
     description:"Su cráter Herschel ocupa casi un tercio de su diámetro y le da aspecto de ojo."},
    {name:"Encélado",type:"Luna helada con géiseres",diameter:"504 km",distance:"238.000 km",
     radius:0.034,orbitRadius:2.50,orbitSpeed:0.0186,color:0xf2f6fa,
     description:"Lanza chorros de agua desde su polo sur y alimenta el anillo E de Saturno."},
    {name:"Tetis",type:"Luna helada con el valle Ítaca",diameter:"1.062 km",distance:"294.700 km",
     radius:0.042,orbitRadius:2.90,orbitSpeed:0.014,color:0xdfe4ea,
     description:"Una grieta gigantesca, Ithaca Chasma, recorre buena parte de su superficie."},
    {name:"Dione",type:"Luna helada con acantilados",diameter:"1.123 km",distance:"377.400 km",
     radius:0.043,orbitRadius:3.35,orbitSpeed:0.0099,color:0xd6dbe2,
     description:"Sus acantilados brillantes son fracturas de hielo, no depósitos de material."},
    {name:"Rea",type:"Segunda luna mayor",diameter:"1.527 km",distance:"527.100 km",
     radius:0.050,orbitRadius:3.90,orbitSpeed:0.0064,color:0xc9ced6,
     description:"Un mundo de hielo muy craterizado, la segunda más grande del sistema de Saturno."},
    {name:"Titán",type:"Luna con atmósfera densa",diameter:"5.150 km",distance:"1.221.900 km",
     radius:0.105,orbitRadius:4.85,orbitSpeed:0.0025,color:0xe8b567,
     description:"La única luna con atmósfera densa: nitrógeno, nubes de metano y lagos en la superficie."}
  ],
  textures:{day:"textures/saturn/day.jpg",ring:"textures/saturn/ring.png"},
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"Saturno aún no se ha condensado dentro del disco solar."},
    {from:"solar-system-formation",state:"gas-accretion",title:"Gigante exterior",description:"Crece en la región fría del disco, donde abundan hielos y gases."},
    {from:"today",state:"modern",title:"Saturno actual",description:"Gigante gaseoso con anillos brillantes y numerosas lunas."}
  ],
  history:[
    {time:"13.800 Ma",title:"Gases primordiales",text:"Su hidrógeno y helio conectan directamente con la composición temprana del cosmos."},
    {time:"4.600 Ma",title:"Gigante exterior",text:"Saturno se forma en la región fría del disco, donde el hielo facilita el crecimiento de núcleos masivos."},
    {time:"Presente",title:"Anillos y lunas",text:"El planeta mantiene un complejo sistema de anillos, resonancias y satélites helados."}
  ]
};
