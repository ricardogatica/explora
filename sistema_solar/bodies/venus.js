export const venus = {
  slug:"venus",type:"Planeta rocoso",name:"Venus",color:0xe2c48c,radius:0.42,orbitRadius:6.2,orbitSpeed:0.015,rotationSpeed:-0.0003,gravity:"8,87 m/s²",gravityFactor:"0,90 g",diameter:"12.104 km",distance:"108,2 millones km",year:"225 días",day:"243 días",temperature:"≈ 465 °C",moons:"0",
  description:"Venus posee una atmósfera muy densa de dióxido de carbono que provoca un efecto invernadero extremo.",
  interaction:"Refleja gran parte de la luz solar. Su atmósfera y su rotación retrógrada lo hacen muy distinto al resto de los planetas rocosos.",
  visibleFrom:"solar-system-formation",
  // La superficie real no se ve nunca: la tapa una capa de nubes densa.
  textures:{day:"textures/venus/day.jpg",clouds:"textures/venus/clouds.jpg"},
  cloudOpacity:0.97,
  atmosphere:{day:0xffc978,sunset:0xff8a2b},
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"El planeta Venus todavía no se ha formado."},
    {from:"solar-system-formation",state:"accretion",title:"Venus temprano",description:"Se ensambla como planeta rocoso en la zona interior del disco solar."},
    {from:"today",state:"modern",title:"Venus actual",description:"Atmósfera masiva de dióxido de carbono y efecto invernadero extremo."}
  ],
  history:[
    {time:"13.800 Ma",title:"Elementos de origen estelar",text:"El carbono, oxígeno y silicio de Venus se sintetizan antes del sistema solar en estrellas y explosiones estelares."},
    {time:"4.600–4.500 Ma",title:"Planeta rocoso temprano",text:"Venus se ensambla cerca de la Tierra dentro del disco interior del Sol."},
    {time:"Presente",title:"Invernadero extremo",text:"Su atmósfera densa atrapa calor y mantiene la superficie más caliente que cualquier otro planeta."}
  ]
};
