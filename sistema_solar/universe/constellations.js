const DETAILED_CONSTELLATIONS = {
  orion:{
    slug:"orion",name:"Orión",hemisphere:"Ecuatorial",ra:5.5,dec:4,visibleFrom:"first-stars",stars:["betelgeuse","rigel"],
    description:"Constelación muy reconocible por sus estrellas brillantes y el cinturón de Orión. Su dibujo simplificado conecta hombros, cinturón y piernas.",
    points:[
      {id:"betelgeuse",starSlug:"betelgeuse",name:"Betelgeuse",x:-3.2,y:2.6,size:.62,color:0xff8a55,type:"Supergigante roja",distance:"≈550 años luz",distanceLy:550,detail:"Supergigante roja en el hombro de Orión."},
      {id:"bellatrix",starSlug:"bellatrix",name:"Bellatrix",x:2.2,y:2.25,size:.42,color:0xbfdcff,type:"Gigante azul",distance:"≈240 años luz",distanceLy:240,detail:"Estrella azul-blanca que marca el otro hombro de Orión."},
      {id:"alnitak",starSlug:"alnitak",name:"Alnitak",x:-1.05,y:.25,size:.34,color:0xcfe8ff,type:"Sistema estelar azul",distance:"≈1.260 años luz",distanceLy:1260,detail:"Una de las tres estrellas del cinturón de Orión."},
      {id:"alnilam",starSlug:"alnilam",name:"Alnilam",x:.05,y:.05,size:.38,color:0xdbeafe,type:"Supergigante azul",distance:"≈2.000 años luz",distanceLy:2000,detail:"Estrella central del cinturón de Orión."},
      {id:"mintaka",starSlug:"mintaka",name:"Mintaka",x:1.15,y:-.12,size:.34,color:0xcfe8ff,type:"Sistema múltiple azul",distance:"≈1.200 años luz",distanceLy:1200,detail:"Estrella occidental del cinturón de Orión."},
      {id:"saiph",starSlug:"saiph",name:"Saiph",x:-2.2,y:-2.7,size:.44,color:0xbfdcff,type:"Supergigante azul",distance:"≈650 años luz",distanceLy:650,detail:"Supergigante azul que marca una pierna de Orión."},
      {id:"rigel",starSlug:"rigel",name:"Rigel",x:2.95,y:-2.95,size:.56,color:0xb7d4ff,type:"Supergigante azul",distance:"≈860 años luz",distanceLy:860,detail:"Supergigante azul brillante en una pierna de Orión."}
    ],
    lines:[["betelgeuse","bellatrix"],["betelgeuse","alnitak"],["bellatrix","mintaka"],["alnitak","alnilam"],["alnilam","mintaka"],["alnitak","saiph"],["mintaka","rigel"],["saiph","rigel"]]
  },
  crux:{
    slug:"crux",name:"Cruz del Sur",hemisphere:"Sur",ra:12.5,dec:-60,visibleFrom:"first-stars",stars:["acrux"],
    description:"Constelación pequeña pero emblemática del cielo austral, usada históricamente para orientación hacia el sur celeste.",
    points:[
      {id:"gacrux",starSlug:"gacrux",name:"Gacrux",x:0,y:2.8,size:.46,color:0xffb07c,type:"Gigante roja",distance:"≈89 años luz",distanceLy:89,detail:"Gigante roja en la parte superior de la Cruz del Sur."},
      {id:"acrux",starSlug:"acrux",name:"Acrux",x:0,y:-2.4,size:.55,color:0xb8d5ff,type:"Sistema estelar múltiple",distance:"≈320 años luz",distanceLy:320,detail:"Sistema estelar múltiple y estrella más brillante de la constelación."},
      {id:"mimosa",starSlug:"mimosa",name:"Mimosa",x:-1.85,y:.2,size:.44,color:0xbfdcff,type:"Gigante azul",distance:"≈280 años luz",distanceLy:280,detail:"Estrella azul brillante que forma el brazo oriental de la cruz."},
      {id:"delta-crucis",starSlug:"delta-crucis",name:"Delta Crucis",x:1.75,y:.05,size:.36,color:0xcfe8ff,type:"Subgigante azul",distance:"≈345 años luz",distanceLy:345,detail:"Estrella azul-blanca que completa el brazo corto de la cruz."}
    ],
    lines:[["gacrux","acrux"],["mimosa","delta-crucis"]]
  },
  "canis-major":{
    slug:"canis-major",name:"Can Mayor",hemisphere:"Sur/Ecuatorial",ra:6.7,dec:-22,visibleFrom:"first-stars",stars:["sirius"],
    description:"Constelación donde se encuentra Sirio, la estrella más brillante del cielo nocturno. El trazo simplificado muestra cabeza, cuerpo y cola del Can Mayor.",
    points:[
      {id:"sirius",starSlug:"sirius",name:"Sirio",x:-3.35,y:.1,size:.72,color:0xbfdcff,type:"Estrella binaria",distance:"8,6 años luz",distanceLy:8.6,detail:"La estrella más brillante del cielo nocturno vista desde la Tierra."},
      {id:"mirzam",starSlug:"mirzam",name:"Mirzam",x:-2.1,y:1.42,size:.4,color:0xcfe8ff,type:"Gigante azul",distance:"≈500 años luz",distanceLy:500,detail:"Estrella azul-blanca cercana visualmente a Sirio."},
      {id:"muliphein",starSlug:"muliphein",name:"Muliphein",x:-.75,y:1.95,size:.32,color:0xdbeafe,type:"Gigante azul-blanca",distance:"≈440 años luz",distanceLy:440,detail:"Punto superior del dibujo simplificado de Can Mayor."},
      {id:"wezen",starSlug:"wezen",name:"Wezen",x:.55,y:-.35,size:.46,color:0xffe7aa,type:"Supergigante amarilla",distance:"≈1.600 años luz",distanceLy:1600,detail:"Supergigante amarilla de Can Mayor."},
      {id:"furud",starSlug:"furud",name:"Furud",x:-.75,y:-1.45,size:.34,color:0xcfe8ff,type:"Estrella azul-blanca",distance:"≈360 años luz",distanceLy:360,detail:"Estrella que ayuda a cerrar el cuerpo del Can Mayor."},
      {id:"adhara",starSlug:"adhara",name:"Adhara",x:2.15,y:.55,size:.48,color:0xbfdcff,type:"Gigante azul",distance:"≈430 años luz",distanceLy:430,detail:"Estrella azul brillante de Can Mayor."},
      {id:"aludra",starSlug:"aludra",name:"Aludra",x:3.45,y:-.6,size:.42,color:0xcfe8ff,type:"Supergigante azul",distance:"≈2.000 años luz",distanceLy:2000,detail:"Estrella luminosa hacia la cola del dibujo."}
    ],
    lines:[["sirius","mirzam"],["mirzam","muliphein"],["sirius","wezen"],["sirius","furud"],["furud","wezen"],["wezen","adhara"],["adhara","aludra"]]
  },
  scorpius:{
    slug:"scorpius",name:"Escorpio",hemisphere:"Sur/Ecuatorial",ra:16.5,dec:-32,visibleFrom:"first-stars",stars:["antares"],
    description:"Constelación marcada por Antares, una supergigante roja que destaca por su color intenso.",
    points:[
      {id:"dschubba",starSlug:"dschubba",name:"Dschubba",x:-2.6,y:1.8,size:.38,color:0xbfdcff,type:"Estrella azul-blanca",distance:"≈400 años luz",distanceLy:400,detail:"Estrella azul-blanca en la cabeza de Escorpio."},
      {id:"antares",starSlug:"antares",name:"Antares",x:-.75,y:.65,size:.64,color:0xff7043,type:"Supergigante roja",distance:"≈550 años luz",distanceLy:550,detail:"Supergigante roja y corazón visual de Escorpio."},
      {id:"sargas",starSlug:"sargas",name:"Sargas",x:1.35,y:-.75,size:.44,color:0xffe7aa,type:"Gigante amarilla",distance:"≈270 años luz",distanceLy:270,detail:"Estrella luminosa en el cuerpo curvado de Escorpio."},
      {id:"shaula",starSlug:"shaula",name:"Shaula",x:3.0,y:-1.95,size:.48,color:0xbfdcff,type:"Sistema estelar azul",distance:"≈570 años luz",distanceLy:570,detail:"Estrella azul en la zona del aguijón de Escorpio."}
    ],
    lines:[["dschubba","antares"],["antares","sargas"],["sargas","shaula"]]
  }
};

const CATALOG = [
  ["andromeda","Andrómeda","Norte",0.7,38,"alpheratz","Alpheratz","Subgigante azul-blanca","≈97 años luz",97,0xcfe8ff],
  ["antlia","Máquina Neumática","Sur",10.1,-32,"alpha-antliae","Alpha Antliae","Gigante naranja","≈365 años luz",365,0xffb36b],
  ["apus","Ave del Paraíso","Sur",16.0,-76,"alpha-apodis","Alpha Apodis","Gigante naranja","≈430 años luz",430,0xffb36b],
  ["aquarius","Acuario","Ecuatorial",22.3,-10,"sadalsuud","Sadalsuud","Supergigante amarilla","≈540 años luz",540,0xffe7aa],
  ["aquila","Águila","Norte/Ecuatorial",19.7,4,"altair","Altair","Estrella blanca tipo A","16,7 años luz",16.7,0xdbeafe],
  ["ara","Altar","Sur",17.4,-55,"beta-arae","Beta Arae","Gigante naranja","≈650 años luz",650,0xffb36b],
  ["aries","Aries","Norte",2.6,20,"hamal","Hamal","Gigante naranja","≈66 años luz",66,0xffb36b],
  ["auriga","Cochero","Norte",5.9,42,"capella","Capella","Sistema estelar múltiple","≈43 años luz",43,0xffe7aa],
  ["bootes","Boyero","Norte",14.7,30,"arcturus","Arturo","Gigante naranja","≈37 años luz",37,0xff9b55],
  ["caelum","Buril","Sur",4.7,-38,"alpha-caeli","Alpha Caeli","Estrella doble","≈66 años luz",66,0xf8fafc],
  ["camelopardalis","Jirafa","Norte",5.4,69,"alpha-camelopardalis","Alpha Camelopardalis","Supergigante azul","≈6.000 años luz",6000,0xbfdcff],
  ["cancer","Cáncer","Norte/Ecuatorial",8.7,20,"altarf","Altarf","Gigante naranja","≈290 años luz",290,0xffb36b],
  ["canes-venatici","Perros de Caza","Norte",13.1,40,"cor-caroli","Cor Caroli","Estrella binaria","≈110 años luz",110,0xdbeafe],
  ["canis-major","Can Mayor","Sur/Ecuatorial",6.7,-22,"sirius","Sirio","Estrella binaria","8,6 años luz",8.6,0xbfdcff],
  ["canis-minor","Can Menor","Norte/Ecuatorial",7.5,6,"procyon","Procyon","Sistema binario","≈11,5 años luz",11.5,0xfff1c1],
  ["capricornus","Capricornio","Sur/Ecuatorial",21.0,-20,"deneb-algedi","Deneb Algedi","Estrella blanca","≈39 años luz",39,0xf8fafc],
  ["carina","Quilla","Sur",8.7,-60,"canopus","Canopus","Supergigante blanca","≈310 años luz",310,0xfff3d0],
  ["cassiopeia","Casiopea","Norte",1.0,60,"schedar","Schedar","Gigante naranja","≈230 años luz",230,0xffb36b],
  ["centaurus","Centauro","Sur",13.0,-47,"rigil-kentaurus","Rigil Kentaurus","Sistema estelar triple","≈4,37 años luz",4.37,0xfff1c1],
  ["cepheus","Cefeo","Norte",22.0,70,"alderamin","Alderamin","Estrella blanca","≈49 años luz",49,0xf8fafc],
  ["cetus","Ballena","Ecuatorial",1.7,-7,"menkar","Menkar","Gigante roja","≈250 años luz",250,0xff8a55],
  ["chamaeleon","Camaleón","Sur",10.7,-78,"alpha-chamaeleontis","Alpha Chamaeleontis","Estrella blanca","≈63 años luz",63,0xf8fafc],
  ["circinus","Compás","Sur",14.8,-63,"alpha-circini","Alpha Circini","Estrella variable","≈54 años luz",54,0xdbeafe],
  ["columba","Paloma","Sur",5.7,-35,"phact","Phact","Subgigante azul","≈270 años luz",270,0xbfdcff],
  ["coma-berenices","Cabellera de Berenice","Norte",12.8,23,"diadem","Diadem","Estrella binaria","≈58 años luz",58,0xf8fafc],
  ["corona-australis","Corona Austral","Sur",19.0,-40,"alfecca-meridiana","Alfecca Meridiana","Estrella blanca","≈125 años luz",125,0xf8fafc],
  ["corona-borealis","Corona Boreal","Norte",15.8,30,"alphecca","Alphecca","Binaria eclipsante","≈75 años luz",75,0xdbeafe],
  ["corvus","Cuervo","Sur/Ecuatorial",12.4,-18,"gienah-corvi","Gienah Corvi","Gigante azul-blanca","≈154 años luz",154,0xcfe8ff],
  ["crater","Copa","Sur/Ecuatorial",11.4,-15,"alkes","Alkes","Gigante naranja","≈160 años luz",160,0xffb36b],
  ["crux","Cruz del Sur","Sur",12.5,-60,"acrux","Acrux","Sistema estelar múltiple","≈320 años luz",320,0xb8d5ff],
  ["cygnus","Cisne","Norte",20.6,42,"deneb","Deneb","Supergigante azul-blanca","≈2.600 años luz",2600,0xcfe8ff],
  ["delphinus","Delfín","Norte",20.7,12,"rotanev","Rotanev","Sistema binario","≈100 años luz",100,0xf8fafc],
  ["dorado","Dorado","Sur",5.2,-60,"alpha-doradus","Alpha Doradus","Estrella binaria","≈170 años luz",170,0xf8fafc],
  ["draco","Dragón","Norte",17.0,65,"thuban","Thuban","Gigante blanca","≈300 años luz",300,0xf8fafc],
  ["equuleus","Caballito","Norte",21.2,8,"kitalpha","Kitalpha","Gigante amarilla","≈186 años luz",186,0xffe7aa],
  ["eridanus","Erídano","Sur/Ecuatorial",3.8,-25,"achernar","Achernar","Estrella azul rápida","≈139 años luz",139,0xbfdcff],
  ["fornax","Horno","Sur",2.8,-30,"dalim","Dalim","Subgigante amarilla","≈46 años luz",46,0xffe7aa],
  ["gemini","Géminis","Norte/Ecuatorial",7.1,22,"pollux","Pólux","Gigante naranja","≈34 años luz",34,0xffb36b],
  ["grus","Grulla","Sur",22.4,-46,"alnair","Alnair","Estrella azul-blanca","≈101 años luz",101,0xcfe8ff],
  ["hercules","Hércules","Norte",17.1,30,"kornephoros","Kornephoros","Gigante amarilla","≈139 años luz",139,0xffe7aa],
  ["horologium","Reloj","Sur",3.3,-53,"alpha-horologii","Alpha Horologii","Gigante naranja","≈117 años luz",117,0xffb36b],
  ["hydra","Hidra","Sur/Ecuatorial",10.5,-20,"alphard","Alphard","Gigante naranja","≈177 años luz",177,0xffb36b],
  ["hydrus","Hidra Macho","Sur",2.5,-70,"beta-hydri","Beta Hydri","Subgigante amarilla","≈24 años luz",24,0xffe7aa],
  ["indus","Indio","Sur",21.9,-55,"alpha-indi","Alpha Indi","Gigante naranja","≈100 años luz",100,0xffb36b],
  ["lacerta","Lagarto","Norte",22.5,45,"alpha-lacertae","Alpha Lacertae","Estrella blanca","≈103 años luz",103,0xf8fafc],
  ["leo","Leo","Norte/Ecuatorial",10.7,15,"regulus","Régulo","Sistema estelar múltiple","≈79 años luz",79,0xbfdcff],
  ["leo-minor","Leo Menor","Norte",10.3,35,"praecipua","Praecipua","Gigante naranja","≈98 años luz",98,0xffb36b],
  ["lepus","Liebre","Sur/Ecuatorial",5.5,-20,"arneb","Arneb","Supergigante amarilla","≈2.200 años luz",2200,0xffe7aa],
  ["libra","Libra","Sur/Ecuatorial",15.2,-15,"zubeneschamali","Zubeneschamali","Estrella azul-blanca","≈185 años luz",185,0xcfe8ff],
  ["lupus","Lobo","Sur",15.3,-45,"men","Men","Gigante azul-blanca","≈460 años luz",460,0xcfe8ff],
  ["lynx","Lince","Norte",8.0,48,"alpha-lyncis","Alpha Lyncis","Gigante naranja","≈203 años luz",203,0xffb36b],
  ["lyra","Lira","Norte",18.8,36,"vega","Vega","Estrella A","25 años luz",25,0xcfe8ff],
  ["mensa","Mesa","Sur",5.5,-77,"alpha-mensae","Alpha Mensae","Enana amarilla","≈33 años luz",33,0xfff1c1],
  ["microscopium","Microscopio","Sur",21.0,-36,"gamma-microscopii","Gamma Microscopii","Gigante amarilla","≈220 años luz",220,0xffe7aa],
  ["monoceros","Unicornio","Ecuatorial",7.1,0,"beta-monocerotis","Beta Monocerotis","Sistema triple","≈700 años luz",700,0xbfdcff],
  ["musca","Mosca","Sur",12.6,-70,"alpha-muscae","Alpha Muscae","Estrella azul-blanca","≈315 años luz",315,0xcfe8ff],
  ["norma","Norma","Sur",16.0,-50,"gamma2-normae","Gamma2 Normae","Gigante amarilla","≈127 años luz",127,0xffe7aa],
  ["octans","Octante","Sur",21.0,-85,"nu-octantis","Nu Octantis","Gigante naranja","≈69 años luz",69,0xffb36b],
  ["ophiuchus","Ofiuco","Ecuatorial",17.4,0,"rasalhague","Rasalhague","Estrella blanca","≈48 años luz",48,0xf8fafc],
  ["orion","Orión","Ecuatorial",5.5,4,"betelgeuse","Betelgeuse","Supergigante roja","≈550 años luz",550,0xff8a55],
  ["pavo","Pavo","Sur",19.6,-65,"peacock","Peacock","Estrella azul-blanca","≈180 años luz",180,0xcfe8ff],
  ["pegasus","Pegaso","Norte",22.7,20,"markab","Markab","Gigante azul-blanca","≈133 años luz",133,0xcfe8ff],
  ["perseus","Perseo","Norte",3.3,45,"mirfak","Mirfak","Supergigante amarilla","≈590 años luz",590,0xffe7aa],
  ["phoenix","Fénix","Sur",1.0,-48,"ankaa","Ankaa","Gigante naranja","≈77 años luz",77,0xffb36b],
  ["pictor","Pintor","Sur",5.7,-52,"alpha-pictoris","Alpha Pictoris","Estrella blanca","≈97 años luz",97,0xf8fafc],
  ["pisces","Peces","Ecuatorial",0.5,10,"alrescha","Alrescha","Estrella binaria","≈151 años luz",151,0xf8fafc],
  ["piscis-austrinus","Pez Austral","Sur",22.8,-30,"fomalhaut","Fomalhaut","Estrella blanca","≈25 años luz",25,0xf8fafc],
  ["puppis","Popa","Sur",7.8,-35,"naos","Naos","Supergigante azul","≈1.080 años luz",1080,0xbfdcff],
  ["pyxis","Brújula","Sur",8.9,-30,"alpha-pyxidis","Alpha Pyxidis","Estrella azul-blanca","≈880 años luz",880,0xcfe8ff],
  ["reticulum","Retículo","Sur",3.9,-60,"alpha-reticuli","Alpha Reticuli","Gigante amarilla","≈162 años luz",162,0xffe7aa],
  ["sagitta","Flecha","Norte",19.7,18,"sham","Sham","Gigante amarilla","≈610 años luz",610,0xffe7aa],
  ["sagittarius","Sagitario","Sur/Ecuatorial",19.0,-25,"kaus-australis","Kaus Australis","Gigante azul-blanca","≈143 años luz",143,0xcfe8ff],
  ["scorpius","Escorpio","Sur/Ecuatorial",16.5,-32,"antares","Antares","Supergigante roja","≈550 años luz",550,0xff7043],
  ["sculptor","Escultor","Sur",0.5,-30,"alpha-sculptoris","Alpha Sculptoris","Gigante azul-blanca","≈780 años luz",780,0xcfe8ff],
  ["scutum","Escudo","Ecuatorial",18.7,-10,"alpha-scuti","Alpha Scuti","Gigante naranja","≈174 años luz",174,0xffb36b],
  ["serpens","Serpiente","Ecuatorial",16.0,10,"unukalhai","Unukalhai","Gigante naranja","≈74 años luz",74,0xffb36b],
  ["sextans","Sextante","Ecuatorial",10.2,0,"alpha-sextantis","Alpha Sextantis","Gigante blanca","≈287 años luz",287,0xf8fafc],
  ["taurus","Tauro","Norte/Ecuatorial",4.5,18,"aldebaran","Aldebarán","Gigante naranja","≈65 años luz",65,0xff8a55],
  ["telescopium","Telescopio","Sur",19.0,-52,"alpha-telescopii","Alpha Telescopii","Subgigante azul","≈278 años luz",278,0xbfdcff],
  ["triangulum","Triángulo","Norte",2.0,32,"mothallah","Mothallah","Subgigante blanca","≈64 años luz",64,0xf8fafc],
  ["triangulum-australe","Triángulo Austral","Sur",16.0,-65,"atria","Atria","Gigante naranja","≈391 años luz",391,0xffb36b],
  ["tucana","Tucán","Sur",23.8,-65,"alpha-tucanae","Alpha Tucanae","Gigante naranja","≈200 años luz",200,0xffb36b],
  ["ursa-major","Osa Mayor","Norte",11.0,55,"dubhe","Dubhe","Gigante naranja","≈123 años luz",123,0xffb36b],
  ["ursa-minor","Osa Menor","Norte",15.0,75,"polaris","Polaris","Supergigante amarilla","≈447 años luz",447,0xffe7aa],
  ["vela","Vela","Sur",9.5,-50,"suhail","Suhail","Supergigante amarilla","≈570 años luz",570,0xffe7aa],
  ["virgo","Virgo","Ecuatorial",13.4,-2,"spica","Spica","Binaria azul", "≈250 años luz",250,0xbfdcff],
  ["volans","Pez Volador","Sur",8.0,-70,"beta-volantis","Beta Volantis","Gigante naranja","≈108 años luz",108,0xffb36b],
  ["vulpecula","Zorra","Norte",20.2,24,"anser","Anser","Gigante roja","≈300 años luz",300,0xff8a55]
];

function makeGeneratedConstellation([slug,name,hemisphere,ra,dec,starSlug,starName,type,distance,distanceLy,color]){
  const size=distanceLy<50 ? .5 : distanceLy<200 ? .42 : .34;
  return {
    slug,name,hemisphere,ra,dec,visibleFrom:"first-stars",generated:true,stars:[starSlug],
    description:`${name} es una de las 88 constelaciones oficiales de la IAU. En esta maqueta educativa se ubica por coordenadas celestes aproximadas y se traza alrededor de ${starName}.`,
    points:[
      {id:starSlug,starSlug,name:starName,x:-1.2,y:.25,size,color,type,distance,distanceLy,detail:`Estrella principal usada como ancla visual de ${name}.`},
      {id:`${slug}-guide-a`,name:`${name} A`,x:.7,y:1.05,size:.22,color:0xe2e8f0,detail:`Estrella guía aproximada del dibujo de ${name}.`},
      {id:`${slug}-guide-b`,name:`${name} B`,x:1.55,y:-.75,size:.2,color:0xdbeafe,detail:`Estrella guía aproximada del dibujo de ${name}.`},
      {id:`${slug}-guide-c`,name:`${name} C`,x:-.35,y:-1.25,size:.18,color:0xcbd5e1,detail:`Estrella guía aproximada del dibujo de ${name}.`}
    ],
    lines:[[starSlug,`${slug}-guide-a`],[`${slug}-guide-a`,`${slug}-guide-b`],[`${slug}-guide-b`,`${slug}-guide-c`],[`${slug}-guide-c`,starSlug]]
  };
}

export const CONSTELLATIONS = CATALOG.map(item=>DETAILED_CONSTELLATIONS[item[0]]||makeGeneratedConstellation(item));
export const CONSTELLATION_BY_SLUG = Object.fromEntries(CONSTELLATIONS.map(constellation=>[constellation.slug,constellation]));
