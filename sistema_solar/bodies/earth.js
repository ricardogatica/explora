export const earth = {
  slug:"earth",type:"Planeta rocoso",name:"Tierra",color:0x4da6ff,radius:0.48,orbitRadius:8.7,orbitSpeed:0.012,rotationSpeed:0.0016,gravity:"9,81 m/s²",gravityFactor:"1 g",diameter:"12.742 km",distance:"149,6 millones km",year:"365 días",day:"24 horas",temperature:"-89 a 58 °C",moons:"1 (Luna)",
  description:"La Tierra alberga agua líquida estable, una atmósfera protectora y una biosfera compleja. Su historia geológica incluye supercontinentes como Pangea.",
  interaction:"La gravedad del Sol mantiene la órbita terrestre. La Luna estabiliza parcialmente el eje terrestre y produce mareas.",
  visibleFrom:"earth-formation",
  timelineStages:[
    {from:"big-bang",state:"future",title:"Aún no existe",description:"La Tierra aparece mucho después, cuando el sistema solar ya está formándose."},
    {from:"earth-formation",state:"molten",title:"Tierra joven",description:"Planeta caliente, parcialmente fundido y golpeado por impactos frecuentes."},
    {from:"early-oceans",state:"archaean",title:"Océanos tempranos",description:"La corteza se estabiliza, aparecen océanos y comienza una larga evolución geoquímica."},
    {from:"great-oxidation",state:"proterozoic",title:"Atmósfera oxigenada",description:"La vida microbiana cambia la química atmosférica al liberar oxígeno."},
    {from:"complex-life",state:"paleozoic",title:"Vida compleja",description:"Los ecosistemas se diversifican y los continentes siguen migrando."},
    {from:"pangaea",state:"pangaea",title:"Pangea",description:"Los continentes se reúnen en un gran supercontinente."},
    {from:"pangaea-breakup",state:"breakup1",title:"Ruptura inicial",description:"Pangea comienza a separarse en grandes bloques continentales."},
    {from:"advanced-breakup",state:"breakup2",title:"Separación avanzada",description:"Los continentes se aproximan a sus formas reconocibles."},
    {from:"modern-continents",state:"modern",title:"Continentes modernos",description:"La configuración continental se parece a la actual."}
  ],
  history:[
    {time:"13.800 Ma",title:"Base cósmica",text:"Los elementos ligeros nacen con el universo; los elementos rocosos se forman mucho después en estrellas previas al Sol."},
    {time:"4.540 Ma",title:"Tierra joven",text:"La acreción construye un planeta caliente, diferenciado y sometido a impactos frecuentes."},
    {time:"335–250 Ma",title:"Pangea",text:"Los continentes se reúnen en un supercontinente antes de separarse hacia la configuración actual."},
    {time:"Presente",title:"Planeta habitable",text:"Océanos, atmósfera, campo magnético y actividad geológica sostienen una biosfera compleja."}
  ]
};
