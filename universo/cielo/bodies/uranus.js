export const uranus = {
  slug:"uranus",type:"Gigante helado",name:"Urano",color:0xa8e3ea,radius:0.68,orbitRadius:28.8,orbitSpeed:0.0027,rotationSpeed:-0.0018,gravity:"8,69 m/s²",gravityFactor:"0,89 g",diameter:"50.724 km",distance:"2.872 millones km",year:"84 años",day:"17,2 horas",temperature:"≈ -224 °C",moons:"27",
  description:"Urano rota casi de lado. Ese eje extremo hace que sus estaciones sean muy particulares.",
  interaction:"Su gran inclinación axial cambia cómo recibe la luz solar durante su larga órbita.",
  visibleFrom:"solar-system-formation",
  textures:{day:"textures/uranus/day.jpg"},
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"Urano todavía no forma parte de ningún sistema planetario."},
    {from:"solar-system-formation",state:"ice-accretion",title:"Gigante helado temprano",description:"Se forma en la zona externa rica en hielos y materiales volátiles."},
    {from:"today",state:"modern",title:"Urano actual",description:"Gigante helado con rotación muy inclinada y estaciones extremas."}
  ],
  history:[
    {time:"13.800 Ma",title:"Materia enriquecida",text:"El hielo de agua, amoníaco y metano requiere elementos fabricados por estrellas anteriores."},
    {time:"4.600 Ma",title:"Formación fría",text:"Urano se ensambla en la zona externa del sistema solar, rica en hielos."},
    {time:"Presente",title:"Rotación inclinada",text:"Su eje extremo sugiere impactos o interacciones tempranas que cambiaron su orientación."}
  ]
};
