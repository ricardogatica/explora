import * as THREE from "three";
import { getGlowTexture } from "./star-renderer.js";

function makeGalaxyPoints({count=18000,radius=520,arms=4,thickness=1,opacity=.58,size=2.1,palette="blue"}={}){
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const arm=i%arms,r=Math.pow(Math.random(),0.72)*radius+8,spin=r*.024,angle=arm*Math.PI*2/arms+spin+(Math.random()-.5)*.62,spread=10+r*.035;
    positions[i*3]=Math.cos(angle)*r+(Math.random()-.5)*spread;
    positions[i*3+1]=(Math.random()-.5)*(10+r*.012)*thickness;
    positions[i*3+2]=Math.sin(angle)*r+(Math.random()-.5)*spread;
    const core=Math.max(0,1-r/radius),noise=Math.random();
    if(palette==="dust"){
      colors[i*3]=0.52+core*.34+noise*.08;
      colors[i*3+1]=0.28+core*.18+noise*.04;
      colors[i*3+2]=0.13+core*.08;
    }else{
      colors[i*3]=0.28+core*.62+noise*.08;
      colors[i*3+1]=0.55+core*.28+noise*.12;
      colors[i*3+2]=0.9+core*.1;
    }
  }
  geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  return new THREE.Points(geometry,new THREE.PointsMaterial({size,map:getGlowTexture(),vertexColors:true,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
}

/* Un esferoide de estrellas: sirve para el bulbo y para el halo.

   `achatado` es cuánto se aplasta en vertical —0,6 en el bulbo, casi 1 en el
   halo— y `concentracion` cómo se apiñan hacia el centro: por debajo de 1 se
   amontonan dentro, que es como se distribuyen las estrellas viejas. */
function makeSpheroidPoints({count,radius,achatado=0.6,concentracion=0.55,color=[1,.86,.62],opacity=.5,size=2}){
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const r=Math.pow(Math.random(),concentracion)*radius;
    const theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1);
    positions[i*3]=r*Math.sin(phi)*Math.cos(theta);
    positions[i*3+1]=r*Math.cos(phi)*achatado;
    positions[i*3+2]=r*Math.sin(phi)*Math.sin(theta);
    /* Más amarillas hacia dentro: son estrellas viejas, y el degradado es lo que
       hace que el bulbo se lea como un bulbo y no como una nube gris. */
    const dentro=1-r/radius, brillo=.55+Math.random()*.45;
    colors[i*3]=color[0]*brillo*(0.72+dentro*0.28);
    colors[i*3+1]=color[1]*brillo*(0.72+dentro*0.28);
    colors[i*3+2]=color[2]*brillo;
  }
  geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  return new THREE.Points(geometry,new THREE.PointsMaterial({size,map:getGlowTexture(),vertexColors:true,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
}

/* Barra central: elipsoide muy alargado de estrellas, denso en el centro y
   deshilachado en las puntas, que es como se ve una barra galáctica real. */
function makeBarPoints({count=5200,length=300,radius=26,size=2.4,opacity=.5}={}){
  const geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    // El exponente concentra las estrellas hacia el centro de la barra.
    const t=(Math.pow(Math.random(),0.65))*(Math.random()<.5?-1:1);
    const perfil=Math.sqrt(Math.max(0,1-t*t));
    positions[i*3]=t*length/2;
    positions[i*3+1]=(Math.random()-.5)*radius*perfil*.55;
    positions[i*3+2]=(Math.random()-.5)*radius*perfil;
    const centro=1-Math.abs(t);
    colors[i*3]=0.98;
    colors[i*3+1]=0.84+centro*.12;
    colors[i*3+2]=0.62+centro*.2;
  }
  geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  return new THREE.Points(geometry,new THREE.PointsMaterial({size,map:getGlowTexture(),vertexColors:true,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
}

/* Rótulo plano que siempre mira a la cámara. Esta vista es educativa y sin
   nombres no hay forma de saber qué es cada elemento. */
function makeGalaxyLabel(texto,{ancho=15,escalaX=1,escalaY=1}={}){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext("2d");
  ctx.font="700 46px Inter, system-ui, sans-serif";
  ctx.textBaseline="middle";
  // Contorno oscuro: sobre los brazos brillantes el texto claro se perdía.
  ctx.lineWidth=7;ctx.strokeStyle="rgba(2,6,23,.85)";ctx.strokeText(texto,10,68);
  ctx.fillStyle="rgba(233,243,255,.98)";ctx.fillText(texto,10,68);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false}));
  // Se compensa la escala del grupo para que el texto no salga deformado.
  sprite.scale.set(ancho/escalaX,ancho*0.25/escalaY,1);
  return sprite;
}

function makeBackgroundGalaxies(count=26,radius=1100){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const distant=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:i%3?0xffd7b0:0xbddcff,transparent:true,opacity:.18+Math.random()*.16,blending:THREE.AdditiveBlending,depthWrite:false}));
    distant.position.set((Math.random()-.5)*radius*2,(Math.random()-.5)*radius*.92,-460-Math.random()*radius*.7);
    const scale=10+Math.random()*28;distant.scale.set(scale*(1.5+Math.random()*1.6),scale*.34,1);distant.rotation.z=Math.random()*Math.PI;
    group.add(distant);
  }
  return group;
}

export function createMilkyWayObject(galaxy,{detail=false}={}){
  const group=new THREE.Group();
  if(!detail)group.position.set(...galaxy.position);
  group.userData.slug=galaxy.slug;group.userData.kind="galaxy";group.userData.clickable=true;group.userData.detail=detail;

  const scale=detail?1:.92,diskOpacity=detail ? .76 : .46,diskTilt=detail ? .5 : .22;
  const disk=makeGalaxyPoints({count:detail?42000:26000,radius:(detail?520:1120)*scale,arms:4,thickness:detail?1.8:1,opacity:diskOpacity,size:detail?2.55:2.2});
  disk.rotation.x=diskTilt;disk.userData.visibleFrom=galaxy.visibleFrom;group.add(disk);

  const dust=makeGalaxyPoints({count:detail?18000:9000,radius:(detail?470:930)*scale,arms:4,thickness:detail?1.1:.8,opacity:detail ? .34 : .18,size:detail?2.2:1.75,palette:"dust"});
  dust.rotation.x=diskTilt+.02;dust.rotation.z=.035;dust.userData.visibleFrom=galaxy.visibleFrom;group.add(dust);

  /* ── Lo que le daba volumen a la galaxia y no estaba ──────────────────────

     El disco fino mide el 1% de su diámetro de grosor, que es exactamente lo
     que mide el de verdad. No estaba demasiado delgado: estaba SOLO. Una galaxia
     no es una lámina, y estas tres piezas son las que le dan cuerpo. Son reales,
     así que esta es de las veces en que lo que se ve mejor es también lo más
     cierto.

     El disco GRUESO: estrellas más viejas repartidas en una capa unas tres veces
     más alta que la del disco fino. Reutiliza el mismo generador con otro
     grosor, y va más tenue y más cálida.

     El BULBO: la concentración de estrellas viejas del centro, unos 10.000 años
     luz de ancho —un 10% del diámetro del disco— y achatada. Es lo que rompe el
     filo de cuchilla al mirar la galaxia de canto.

     El HALO: una envoltura casi esférica y muy dispersa, del tamaño del disco.
     Apenas se ve, y es justo lo que hace que el disco no acabe en un borde
     recortado. */
  const discoGrueso=makeGalaxyPoints({
    count:detail?9000:6000,radius:(detail?500:1000)*scale,arms:4,
    thickness:detail?3.4:3.2,opacity:detail?.16:.10,size:detail?2.0:1.7,palette:"dust"
  });
  discoGrueso.rotation.x=diskTilt;discoGrueso.userData.visibleFrom=galaxy.visibleFrom;group.add(discoGrueso);

  const bulbo=makeSpheroidPoints({
    count:detail?11000:8000,radius:(detail?108:112)*scale,achatado:.62,concentracion:.5,
    color:[1,.85,.6],opacity:detail?.5:.34,size:detail?2.3:2.0
  });
  bulbo.rotation.x=diskTilt;bulbo.userData.visibleFrom=galaxy.visibleFrom;group.add(bulbo);

  const halo=makeSpheroidPoints({
    count:detail?3000:2400,radius:(detail?520:1060)*scale,achatado:.86,concentracion:1.1,
    color:[.86,.9,1],opacity:detail?.10:.07,size:detail?1.5:1.3
  });
  halo.userData.visibleFrom=galaxy.visibleFrom;group.add(halo);

  const coreRadius=detail?38:42,core=new THREE.Mesh(new THREE.SphereGeometry(coreRadius,56,56),new THREE.MeshBasicMaterial({color:0xfff1d6,transparent:true,opacity:.88,blending:THREE.AdditiveBlending,depthWrite:false}));
  core.userData.slug=galaxy.slug;core.userData.kind="galaxy";core.userData.clickable=true;core.userData.visibleFrom=galaxy.visibleFrom;group.add(core);

  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:0xffd2ae,transparent:true,opacity:detail ? .48 : .25,blending:THREE.AdditiveBlending,depthWrite:false}));
  const glowSize=detail?260:170;glow.scale.set(glowSize*1.35,glowSize*.72,1);glow.rotation.z=-.18;glow.userData.slug=galaxy.slug;glow.userData.kind="galaxy";glow.userData.clickable=true;glow.userData.visibleFrom=galaxy.visibleFrom;group.add(glow);

  /* La barra galáctica es una concentración alargada de estrellas que cruza el
     centro; la Vía Láctea es una espiral barrada. Antes se dibujaba con un
     CylinderGeometry abierto y a doble cara, así que se veían la silueta del
     tubo y su boca en el extremo lejano: parecía una tubería atravesando el
     bulbo. Ahora son estrellas de verdad, más densas hacia el centro. */
  const bar=makeBarPoints({count:detail?5200:2600,length:detail?300:310,radius:detail?26:24,size:detail?2.4:2.0,opacity:detail?.5:.28});
  bar.rotation.y=.28;bar.userData.visibleFrom=galaxy.visibleFrom;group.add(bar);

  const solarSystemPosition=new THREE.Vector3(245,16,-118);
  const solarMarker=new THREE.Mesh(new THREE.SphereGeometry(detail?6:8,24,24),new THREE.MeshBasicMaterial({color:0xfff3a3,transparent:true,opacity:.95,blending:THREE.AdditiveBlending}));
  solarMarker.position.copy(solarSystemPosition);solarMarker.userData.slug=galaxy.slug;solarMarker.userData.kind="galaxy";solarMarker.userData.clickable=true;solarMarker.userData.visibleFrom=galaxy.visibleFrom;group.add(solarMarker);
  const markerGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:0x38bdf8,transparent:true,opacity:.52,blending:THREE.AdditiveBlending,depthWrite:false}));
  markerGlow.position.copy(solarSystemPosition);markerGlow.scale.set(detail?52:70,detail?52:70,1);markerGlow.userData.visibleFrom=galaxy.visibleFrom;group.add(markerGlow);
  const orbit=new THREE.Mesh(new THREE.RingGeometry(260,261.4,192),new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:detail ? .24 : .16,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  orbit.rotation.x=Math.PI/2+diskTilt;orbit.userData.visibleFrom=galaxy.visibleFrom;group.add(orbit);
  group.rotation.z=detail ? -.34 : -.16;
  /* En detalle la galaxia se encoge para caber entera en el encuadre. El disco
     tiene radio 520 y la cámara solo abarca 289 a la distancia a la que puede
     estar —más lejos la niebla de la escena se la traga—, así que sin esto los
     brazos espirales quedaban fuera de pantalla y solo se veía el centro. */
  const ajuste=detail?0.60:1;
  const escalaX=(detail?1.24:1.05)*ajuste, escalaY=(detail?.78:.92)*ajuste;
  group.scale.set(escalaX,escalaY,ajuste);

  if(detail){
    group.add(makeBackgroundGalaxies());

    /* Rótulos. Sin ellos la vista era un óvalo con un tubo y un aro, y no había
       manera de saber qué representaba cada cosa.

       El tamaño se divide por la escala del grupo porque los sprites la heredan:
       con el escalado no uniforme (1.24, 0.78) el texto salía aplastado. */
    /* Posiciones elegidas para que ninguno caiga bajo el panel de información,
       que ocupa el tercio izquierdo de la pantalla. «Órbita del Sol» estaba a
       la izquierda del anillo y quedaba tapado; ahora va abajo, sobre el tramo
       inferior del mismo anillo. */
    const rotulos=[
      ["Bulbo central",  [0,coreRadius*3.4,0],  150],
      ["Barra",          [206,-66,0],           104],
      ["Órbita del Sol", [-30,-52,306],         168],
      ["Sistema Solar",  [solarSystemPosition.x+40,solarSystemPosition.y+62,solarSystemPosition.z], 160]
    ];
    for(const [texto,pos,ancho] of rotulos){
      const etiqueta=makeGalaxyLabel(texto,{ancho,escalaX,escalaY});
      etiqueta.position.set(...pos);
      etiqueta.userData.visibleFrom=galaxy.visibleFrom;
      group.add(etiqueta);
    }
  }

  return{group,disk,dust,discoGrueso,bulbo,halo,core,glow,bar,solarMarker,markerGlow,solarSystemPosition,kind:"galaxy",detail};
}

/* `avance` son cuadros de referencia transcurridos (ver tiempo.js): los
   incrementos de abajo están escritos por cuadro y se corrigen con él. */
export function animateGalaxyObject(entry,time,avance=1){
  const group=entry.group||entry.object||entry;
  if(!group.userData.detail)group.rotation.y+=.0002*avance;
  const disk=entry.disk||group.children.find(child=>child.isPoints),core=entry.core||group.children.find(child=>child.isMesh);
  if(disk)disk.rotation.y+=(group.userData.detail ? .00016 : .0005)*avance;
  if(entry.dust)entry.dust.rotation.y+=(group.userData.detail ? .00012 : .00035)*avance;
  if(core)core.scale.setScalar(1+Math.sin(time*1.6)*.035);
}
