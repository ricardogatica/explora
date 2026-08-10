import * as THREE from "three";
import { drawEpochLand } from "../cielo/earth-epochs.js";
import { getGlowTexture } from "./star-renderer.js";

export function makePlanetTexture(kind,colorHex){
  const c=document.createElement("canvas");c.width=1024;c.height=512;
  const ctx=c.getContext("2d"),grad=ctx.createLinearGradient(0,0,0,c.height);
  if(kind==="sun"){
    grad.addColorStop(0,"#fff4b0");grad.addColorStop(0.5,"#ffba45");grad.addColorStop(1,"#ff6d00");ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<1800;i++){ctx.fillStyle=`rgba(255, ${160+Math.random()*90}, 0, ${0.02+Math.random()*0.06})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,20+Math.random()*80,0,Math.PI*2);ctx.fill()}
  }else if(kind.startsWith("earth-")){
    const oceanColors={"earth-modern":["#083c68","#1f7bbd"],"earth-pangaea":["#0b416d","#2d7cbe"],"earth-breakup1":["#0a3a64","#2d7bb8"],"earth-breakup2":["#0b436f","#3b91cf"],"earth-archaean":["#0c3b47","#1e7a7a"],"earth-proterozoic":["#114f6d","#298f96"],"earth-paleozoic":["#104a76","#2e86bc"],"earth-molten":["#2a0f05","#8b1f0e"]};
    grad.addColorStop(0,oceanColors[kind][0]);grad.addColorStop(1,oceanColors[kind][1]);ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
    if(kind==="earth-molten"){
      for(let i=0;i<900;i++){ctx.fillStyle=`rgba(255, ${80+Math.random()*100}, 0, ${0.05+Math.random()*0.08})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,10+Math.random()*35,0,Math.PI*2);ctx.fill()}
    }else{
      // Las costas salen de la máscara real de la textura, repartida en placas
      // y movida según la época: Pangea tiene la forma de África y Sudamérica
      // encajando de verdad, no un polígono aproximado a ojo.
      const fills={"earth-pangaea":"#768f5f","earth-breakup1":"#879b65","earth-breakup2":"#8b9d67","earth-modern":"#6d915f","earth-archaean":"#6f7750","earth-proterozoic":"#7b8658","earth-paleozoic":"#7e915d"};
      drawEpochLand(ctx,c.width,c.height,kind.replace("earth-",""),fills[kind]||"#6d915f");
      for(let i=0;i<600;i++){ctx.fillStyle=`rgba(255,255,255,${0.02+Math.random()*0.03})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,8+Math.random()*26,0,Math.PI*2);ctx.fill()}
      if(kind==="earth-modern"){ctx.fillStyle="rgba(245,248,255,.9)";ctx.fillRect(0,0,c.width,25);ctx.fillRect(0,c.height-25,c.width,25)}
    }
  }else{
    ctx.fillStyle=`#${new THREE.Color(colorHex).getHexString()}`;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<500;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.06})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,5+Math.random()*25,0,Math.PI*2);ctx.fill()}
    if(kind==="venus"){for(let y=0;y<c.height;y+=24){ctx.fillStyle=`rgba(255,255,255,${0.05+Math.random()*0.05})`;ctx.fillRect(0,y,c.width,12+Math.random()*10)}}
    if(["jupiter","saturn","uranus","neptune"].includes(kind)){for(let y=0;y<c.height;y+=22){ctx.fillStyle=`rgba(255,255,255,${0.07+Math.random()*0.1})`;ctx.fillRect(0,y,c.width,9+Math.random()*18)}if(kind==="jupiter"){ctx.fillStyle="rgba(180,90,60,.35)";ctx.beginPath();ctx.ellipse(c.width*0.72,c.height*0.58,75,48,0,0,Math.PI*2);ctx.fill()}}
    if(["mars","mercury","moon"].includes(kind)){for(let i=0;i<80;i++){ctx.strokeStyle=`rgba(0,0,0,${0.08+Math.random()*0.14})`;ctx.beginPath();const x=Math.random()*c.width,y=Math.random()*c.height,r=8+Math.random()*35;ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}}
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

export function materialForBody(body,slug,stage="modern"){
  if(slug==="sun")return new THREE.MeshBasicMaterial({map:makePlanetTexture("sun",body.color)});
  const kind=slug==="earth"?`earth-${stage}`:slug;
  return new THREE.MeshStandardMaterial({map:makePlanetTexture(kind,body.color),roughness:1});
}

export function createBodyMaterials(BODY_DATA){
  return {
    sun:materialForBody(BODY_DATA.sun,"sun"),
    mercury:materialForBody(BODY_DATA.mercury,"mercury"),
    venus:materialForBody(BODY_DATA.venus,"venus"),
    earthModern:materialForBody(BODY_DATA.earth,"earth","modern"),
    earthPangaea:materialForBody(BODY_DATA.earth,"earth","pangaea"),
    earthBreakup1:materialForBody(BODY_DATA.earth,"earth","breakup1"),
    earthBreakup2:materialForBody(BODY_DATA.earth,"earth","breakup2"),
    earthArchaean:materialForBody(BODY_DATA.earth,"earth","archaean"),
    earthProterozoic:materialForBody(BODY_DATA.earth,"earth","proterozoic"),
    earthPaleozoic:materialForBody(BODY_DATA.earth,"earth","paleozoic"),
    earthMolten:materialForBody(BODY_DATA.earth,"earth","molten"),
    moon:materialForBody(BODY_DATA.moon,"moon"),
    mars:materialForBody(BODY_DATA.mars,"mars"),
    jupiter:materialForBody(BODY_DATA.jupiter,"jupiter"),
    saturn:materialForBody(BODY_DATA.saturn,"saturn"),
    uranus:materialForBody(BODY_DATA.uranus,"uranus"),
    neptune:materialForBody(BODY_DATA.neptune,"neptune")
  };
}

export function createBodyMesh(body,slug,{scale=1,stage="modern"}={}){
  return new THREE.Mesh(new THREE.SphereGeometry(body.radius*scale,64,64),materialForBody(body,slug,stage));
}

/* ---------------------------------------------------------------------------
   Material fotorrealista a partir de mapas reales.

   Es genérico: no sabe nada de la Tierra. Cualquier cuerpo cuyo archivo de
   datos declare `textures` lo recibe; el que no, sigue con la procedural de
   arriba. Añadir otro planeta es soltar los archivos y declarar el campo.
--------------------------------------------------------------------------- */

/* Hasta dónde llega el borde exterior del anillo, en radios del cuerpo. El
   valor real de Saturno son unos 2,3 radios, así que está a escala. Se exporta
   porque el encuadre de la ficha necesita saberlo para que los anillos quepan,
   y tenerlo en dos sitios distintos acabaría en que uno se queda atrás. */
export const RING_OUTER_SCALE=2.27;

export function hasPhotorealTextures(body){
  return Boolean(body?.textures?.day);
}

function loadMap(loader,url,{color=false,anisotropy=1}={}){
  return new Promise((resolve,reject)=>{
    loader.load(url,texture=>{
      if(color)texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=anisotropy;
      resolve(texture);
    },undefined,reject);
  });
}

/* Phong y no Standard a propósito: el mapa especular de estos datasets es
   clásico, no PBR, y describe los océanos con precisión. En Phong entra
   directo como specularMap; en Standard habría que invertirlo y reinterpretarlo
   como rugosidad, que no significa lo mismo. */
function surfaceMaterial(maps){
  /* El brillo especular azulado solo tiene sentido donde hay mapa que diga
     dónde está el agua. En un planeta seco como Marte lo dejaría con reflejos
     de charco, así que sin ese mapa la superficie va mate. */
  const material=new THREE.MeshPhongMaterial({
    map:maps.day,
    normalMap:maps.normal||null,
    normalScale:new THREE.Vector2(0.62,0.62),
    specularMap:maps.specular||null,
    specular:new THREE.Color(maps.specular?0x7dbdff:0x0a0a0a),
    shininess:maps.specular?18:4
  });
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `gl_FragColor.rgb = max(gl_FragColor.rgb, outgoingLight * 0.018);
       #include <dithering_fragment>`
    );
  };
  return material;
}

/* Luces de ciudad: solo en el hemisferio que no ve el Sol. */
function nightMaterial(map,sunDirection){
  return new THREE.ShaderMaterial({
    uniforms:{nightMap:{value:map},sunDirection,intensity:{value:1.15}},
    vertexShader:`
      varying vec2 vUv; varying vec3 vWorldNormal;
      void main(){
        vUv=uv;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      uniform sampler2D nightMap; uniform vec3 sunDirection; uniform float intensity;
      varying vec2 vUv; varying vec3 vWorldNormal;
      void main(){
        float sunDot=dot(normalize(vWorldNormal),normalize(sunDirection));
        float night=1.0-smoothstep(-0.18,0.14,sunDot);
        vec3 tex=texture2D(nightMap,vUv).rgb;
        float luma=dot(tex,vec3(0.2126,0.7152,0.0722));
        vec3 warm=mix(tex,vec3(1.0,0.63,0.28)*luma,0.34);
        float cityMask=smoothstep(0.025,0.42,luma);
        vec3 color=warm*night*intensity*(0.22+cityMask*1.5);
        gl_FragColor=vec4(color,max(max(color.r,color.g),color.b));
      }`,
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false
  });
}

function cloudShadowMaterial(map,sunDirection){
  return new THREE.ShaderMaterial({
    uniforms:{cloudMap:{value:map},sunDirection},
    vertexShader:`
      varying vec2 vUv; varying vec3 vWorldNormal;
      void main(){
        vUv=uv;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      uniform sampler2D cloudMap; uniform vec3 sunDirection;
      varying vec2 vUv; varying vec3 vWorldNormal;
      void main(){
        vec3 cloud=texture2D(cloudMap,vUv+vec2(0.0016,0.0)).rgb;
        float density=dot(cloud,vec3(0.3333));
        float daylight=smoothstep(-0.1,0.45,dot(normalize(vWorldNormal),normalize(sunDirection)));
        gl_FragColor=vec4(vec3(0.0),density*daylight*0.115);
      }`,
    transparent:true,depthWrite:false
  });
}

function atmosphereMaterial(sunDirection,ajustes={}){
  const dia=new THREE.Color(ajustes.day??0x1a7aff);
  const borde=new THREE.Color(ajustes.sunset??0xff3809);
  return new THREE.ShaderMaterial({
    uniforms:{sunDirection,colorDia:{value:dia},colorBorde:{value:borde}},
    vertexShader:`
      varying vec3 vWorldNormal; varying vec3 vWorldPosition;
      void main(){
        vec4 wp=modelMatrix*vec4(position,1.0);
        vWorldPosition=wp.xyz;
        vWorldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader:`
      uniform vec3 sunDirection; uniform vec3 colorDia; uniform vec3 colorBorde;
      varying vec3 vWorldNormal; varying vec3 vWorldPosition;
      void main(){
        vec3 viewDir=normalize(cameraPosition-vWorldPosition);
        float rim=pow(1.0-max(dot(vWorldNormal,viewDir),0.0),3.4);
        float sunAmount=dot(vWorldNormal,normalize(sunDirection));
        float day=smoothstep(-0.42,0.35,sunAmount);
        float sunsetBand=exp(-pow((sunAmount+0.08)*7.0,2.0));
        vec3 color=mix(colorDia*(0.28+day*0.72),colorBorde,sunsetBand*0.55);
        float alpha=rim*(0.18+day*0.72)+sunsetBand*rim*0.16;
        gl_FragColor=vec4(color*alpha*1.25,alpha);
      }`,
    side:THREE.BackSide,transparent:true,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
}

/* Monta el cuerpo con los mapas que declare, que no tienen por qué ser los
   cinco. Solo `day` es obligatorio: la Tierra trae el juego completo y el
   resto de planetas solo su superficie. Cada capa se añade únicamente si
   existe su mapa, así que Marte no arrastra nubes ni luces de ciudad.

   Rechaza si falla alguna descarga, para que quien llame se quede con la
   textura procedural en vez de una escena a medio construir. */
export async function loadPhotorealBody(body,{radius=1,sunDirection,anisotropy=1,segments=160}={}){
  const loader=new THREE.TextureLoader();
  const t=body.textures;
  const opcional=(url,color)=>url?loadMap(loader,url,{color,anisotropy}):Promise.resolve(null);
  const [day,clouds,lights,normal,specular,ring]=await Promise.all([
    loadMap(loader,t.day,{color:true,anisotropy}),
    opcional(t.clouds,true),
    opcional(t.lights,true),
    opcional(t.normal,false),
    opcional(t.specular,false),
    opcional(t.ring,true)
  ]);

  const sun=sunDirection||{value:new THREE.Vector3(1,0.1,0.5).normalize()};
  const group=new THREE.Group();
  const sphere=r=>new THREE.SphereGeometry(radius*r,segments,segments);

  /* El Sol emite su propia luz: con un material que responda a la iluminación
     saldría medio a oscuras, porque la única fuente de la escena es él mismo. */
  const superficie=body.emissive
    ? new THREE.MeshBasicMaterial({map:day})
    : surfaceMaterial({day,normal,specular});
  group.add(new THREE.Mesh(sphere(1),superficie));

  if(lights)group.add(new THREE.Mesh(sphere(1.0015),nightMaterial(lights,sun)));

  let cloudLayer=null;
  if(clouds){
    group.add(new THREE.Mesh(sphere(1.0032),cloudShadowMaterial(clouds,sun)));
    cloudLayer=new THREE.Mesh(sphere(1.0105),new THREE.MeshPhongMaterial({
      map:clouds,alphaMap:clouds,transparent:true,
      opacity:body.cloudOpacity??0.82,depthWrite:false,
      side:THREE.FrontSide,specular:new THREE.Color(0x334455),shininess:2
    }));
    group.add(cloudLayer);
  }

  // Solo tienen halo atmosférico los cuerpos que lo declaran: la Tierra y Venus.
  if(body.atmosphere)group.add(new THREE.Mesh(sphere(1.075),atmosphereMaterial(sun,body.atmosphere)));

  /* Anillos de Saturno: la textura es una tira radial con transparencia, así
     que se mapea sobre el anillo por distancia al centro en vez de con las UV
     del RingGeometry, que van pensadas para otra cosa. */
  if(ring){
    const anillos=new THREE.Mesh(
      ringGeometry(radius*1.24,radius*RING_OUTER_SCALE,192),
      new THREE.MeshBasicMaterial({map:ring,side:THREE.DoubleSide,transparent:true,opacity:0.94,depthWrite:false})
    );
    anillos.rotation.x=Math.PI/2;
    group.add(anillos);
  }

  return {group,cloudLayer};
}

/* El halo era una esfera sólida con mezcla aditiva: sin desvanecido se veía
   como un disco plano recortado alrededor del Sol, y con tone mapping ACES
   ese disco además salía verdoso. Un sprite con degradado radial sí se apaga
   hacia el borde, que es lo que hace una corona. */
export function createSunGlow(radius,scale=2.6){
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({
    map:getGlowTexture(),color:0xffc978,transparent:true,opacity:0.55,
    blending:THREE.AdditiveBlending,depthWrite:false
  }));
  halo.scale.set(radius*scale,radius*scale,1);
  return halo;
}

/* Geometría de anillo con las UV mapeadas por distancia al centro.

   La textura del anillo es una tira radial: un píxel de ancho por cada radio,
   del borde interior al exterior. Las UV que genera RingGeometry van pensadas
   para otra cosa, así que hay que reescribirlas o la imagen sale retorcida.
   Esto lo usan tanto la ficha de detalle como las vistas de conjunto, para que
   el anillo se vea igual en todas. */
function ringGeometry(inner,outer,segments){
  const geometria=new THREE.RingGeometry(inner,outer,segments);
  const pos=geometria.attributes.position,uv=geometria.attributes.uv;
  const v=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    v.fromBufferAttribute(pos,i);
    uv.setXY(i,(v.length()-inner)/(outer-inner),0.5);
  }
  return geometria;
}

export function createSaturnRings(radius,{inner=1.24,outer=RING_OUTER_SCALE,segments=192,texture=null}={}){
  const material=new THREE.MeshBasicMaterial({
    // Beige plano mientras llega la imagen, o si no llega nunca.
    color:texture?0xffffff:0xd6c6a0,
    side:THREE.DoubleSide,transparent:true,
    opacity:texture?0.94:0.65,depthWrite:false
  });
  if(texture){
    new THREE.TextureLoader().load(texture,mapa=>{
      mapa.colorSpace=THREE.SRGBColorSpace;
      material.map=mapa;material.needsUpdate=true;
    },undefined,()=>{ material.color.setHex(0xd6c6a0);material.opacity=0.65; });
  }
  const anillos=new THREE.Mesh(ringGeometry(radius*inner,radius*outer,segments),material);
  anillos.rotation.x=Math.PI/2;
  return anillos;
}
