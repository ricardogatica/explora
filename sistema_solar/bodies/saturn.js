export const saturn = {
  slug:"saturn",type:"Gigante gaseoso",name:"Saturno",color:0xe4d39e,radius:0.86,orbitRadius:22.5,orbitSpeed:0.0039,rotationSpeed:0.0022,gravity:"10,44 m/s²",gravityFactor:"1,07 g",diameter:"116.460 km",distance:"1.433 millones km",year:"29,45 años",day:"10,7 horas",temperature:"≈ -178 °C",moons:"140+",
  description:"Saturno es famoso por su sistema de anillos, compuesto por hielo, roca y polvo distribuido en bandas.",
  interaction:"Los anillos y sus lunas se moldean mediante resonancias orbitales y la gravedad del planeta.",
  visibleFrom:"solar-system-formation",
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
