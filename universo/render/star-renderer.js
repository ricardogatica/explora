import * as THREE from "three";

let glowTexture;

export function getGlowTexture(){
  if(glowTexture)return glowTexture;
  const canvas=document.createElement("canvas");canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext("2d"),gradient=ctx.createRadialGradient(64,64,0,64,64,63);
  gradient.addColorStop(0,"rgba(255,255,255,1)");
  gradient.addColorStop(.24,"rgba(255,255,255,.74)");
  gradient.addColorStop(.58,"rgba(255,255,255,.2)");
  gradient.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  glowTexture=new THREE.CanvasTexture(canvas);glowTexture.colorSpace=THREE.SRGBColorSpace;
  return glowTexture;
}


/* ---------------------------------------------------------------------------
   Superficie estelar.

   Una estrella era una esfera de color plano, así que en su ficha se veía como
   un círculo recortado. No hay texturas de superficie estelar publicadas —las
   fuentes de mapas planetarios no las incluyen—, así que se genera en el
   shader, que además es lo apropiado: la superficie de una estrella no es un
   mapa fijo, es un plasma que hierve.

   Tres cosas la hacen creíble, y las tres son física real:

   - Granulación: las celdas de convección que suben plasma caliente y bajan el
     frío. Se aproximan con ruido en varias octavas, animado despacio.
   - Oscurecimiento del limbo: el borde del disco se ve más apagado que el
     centro, porque ahí la línea de visión atraviesa capas más altas y frías.
     Sin esto una estrella parece un disco de cartón; es el efecto que más
     aporta.
   - Manchas: zonas más frías donde el campo magnético frena la convección.
--------------------------------------------------------------------------- */
export function starSurfaceMaterial(baseColor,{spots=0.5}={}){
  return new THREE.ShaderMaterial({
    uniforms:{
      uTime:{value:0},
      uColor:{value:new THREE.Color(baseColor)},
      uSpots:{value:spots}
    },
    vertexShader:`
      varying vec3 vPos; varying vec3 vNormal; varying vec3 vViewPos;
      void main(){
        vPos=position;
        vNormal=normalize(normalMatrix*normal);
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        vViewPos=mv.xyz;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:`
      uniform float uTime; uniform vec3 uColor; uniform float uSpots;
      varying vec3 vPos; varying vec3 vNormal; varying vec3 vViewPos;

      // Ruido de valor en 3D: barato y suficiente para plasma.
      float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 p){
        vec3 i=floor(p), f=fract(p);
        f=f*f*(3.0-2.0*f);
        float n=mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                        mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                        mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        return n;
      }
      float fbm(vec3 p){
        float suma=0.0, amp=0.5;
        for(int i=0;i<4;i++){ suma+=noise(p)*amp; p*=2.03; amp*=0.5; }
        return suma;
      }

      /* Celdas con borde, para la granulación de verdad.

         La superficie del Sol no es una nube suave: es un mosaico de celdas de
         convección de unos mil kilómetros, cada una con su interior brillante y
         un SURCO OSCURO alrededor por donde el plasma, ya frío, vuelve a bajar.
         Ese entramado de surcos es lo que hace que una foto del Sol se reconozca
         al instante, y con ruido suave no sale: sale un algodón.

         Un Worley de verdad cuesta veintisiete celdas por píxel. El mínimo de
         tres capas de |ruido| desplazadas entre sí da el mismo efecto —valles
         estrechos donde el valor se acerca a cero— con tres consultas. */
      float celdas(vec3 p){
        float a=abs(noise(p)*2.0-1.0);
        float b=abs(noise(p*1.20+vec3(13.0,7.0,19.0))*2.0-1.0);
        float c=abs(noise(p*0.85+vec3(-7.0,23.0,11.0))*2.0-1.0);
        return min(a,min(b,c));
      }

      void main(){
        vec3 dir=normalize(vPos);

        // El plasma se agita: dos escalas moviéndose a ritmos distintos.
        float granos=fbm(dir*7.0+vec3(0.0,uTime*0.05,0.0));
        float finos=fbm(dir*19.0-vec3(uTime*0.08,0.0,0.0));
        float superficie=granos*0.72+finos*0.28;

        // Manchas: mínimos amplios del ruido lento.
        float mancha=smoothstep(0.30,0.14,fbm(dir*3.1+vec3(uTime*0.015)));

        // Oscurecimiento del limbo, con la ley clásica de dos coeficientes.
        float mu=max(dot(normalize(vNormal),normalize(-vViewPos)),0.0);
        float limbo=0.32+0.72*mu-0.04*mu*mu;

        /* Los surcos entre gránulos. La escala va con la del ruido fino para
           que el mosaico y el plasma cuenten lo mismo, y se mueve despacio:
           una celda de convección vive unos minutos. */
        float surco=smoothstep(0.0,0.16,celdas(dir*24.0+vec3(0.0,uTime*0.03,0.0)));

        // El centro de cada gránulo tira a blanco; los surcos, al color propio.
        vec3 caliente=mix(uColor,vec3(1.0),0.52);
        vec3 color=mix(uColor*0.60,caliente,superficie);
        // El surco oscurece sin llegar a negro: por ahí también sale luz.
        color*=mix(0.62,1.0,surco);
        color*=limbo;
        color=mix(color,uColor*0.42,mancha*uSpots);

        /* Se pasa de 1 a propósito. Una estrella no está iluminada: emite. Con
           tone mapping ACES un valor de 1 se comprime a un gris claro, así que
           sin empuje Sirio salía como una luna azulada. Pero el empuje tiene
           techo: con 2,9 el disco se quemaba entero y se perdía justo la
           granulación que se acaba de calcular. 1,7 deja el centro casi blanco
           y la estructura visible hacia el limbo. */
        gl_FragColor=vec4(color*1.7,1.0);
      }`
  });
}

export function createStarObject(star,{detail=false}={}){
  const group=new THREE.Group();
  if(!detail)group.position.set(...star.position);
  group.userData.slug=star.slug;group.userData.kind=star.kind||"star";group.userData.clickable=true;
  const radius=Math.max(star.size*(detail?.42:.9),detail?1.8:5.5);
  /* El shader solo en detalle. En la vista del universo hay 108 estrellas y
     cada una ocupa unos pocos píxeles: ahí el color plano es indistinguible y
     mucho más barato. */
  const material=detail
    ? starSurfaceMaterial(star.color,{spots:star.kind==="star"?0.24:0.12})
    : new THREE.MeshBasicMaterial({color:star.color});
  const core=new THREE.Mesh(new THREE.SphereGeometry(radius,detail?96:48,detail?96:48),material);
  core.userData.slug=star.slug;core.userData.clickable=true;group.add(core);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:star.color,transparent:true,opacity:detail?.72:.64,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true}));
  const glowSize=radius*(detail?5.2:4.3);glow.scale.set(glowSize,glowSize,1);glow.userData.slug=star.slug;glow.userData.clickable=true;group.add(glow);
  return{group,core,glow};
}

export function createQuasarObject(quasar,{detail=false}={}){
  const group=new THREE.Group();
  if(!detail)group.position.set(...quasar.position);
  group.userData.slug=quasar.slug;group.userData.kind=quasar.kind;group.userData.clickable=true;
  const coreRadius=quasar.size*(detail?.42:.72);
  const core=new THREE.Mesh(new THREE.SphereGeometry(coreRadius,64,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.94,blending:THREE.AdditiveBlending,depthWrite:false}));
  core.userData.slug=quasar.slug;core.userData.clickable=true;group.add(core);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:0xffbd69,transparent:true,opacity:.58,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true}));
  const haloSize=quasar.size*(detail?3.6:2.9);halo.scale.set(haloSize,haloSize,1);halo.userData.slug=quasar.slug;halo.userData.clickable=true;group.add(halo);
  const ringCount=detail?8:5;
  for(let i=0;i<ringCount;i++){const disk=new THREE.Mesh(new THREE.RingGeometry(quasar.size*((detail?.55:.8)+i*(detail?.13:.22)),quasar.size*((detail?.62:.92)+i*(detail?.13:.22)),192),new THREE.MeshBasicMaterial({color:i%2?0xff8a3d:0xffe0a3,transparent:true,opacity:(detail?.42:.38)-i*.035,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));disk.rotation.x=detail?Math.PI/2.35:Math.PI/2.25;disk.rotation.z=i*.18;group.add(disk)}
  const jetMat=new THREE.MeshBasicMaterial({color:0xc7e6ff,transparent:true,opacity:.32,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});
  const jetA=new THREE.Mesh(new THREE.PlaneGeometry(quasar.size*(detail?8.5:8),quasar.size*(detail?.42:.34)),jetMat);jetA.rotation.z=detail?.48:.42;group.add(jetA);
  const jetB=jetA.clone();jetB.rotation.z=(detail?.48:.42)+Math.PI;group.add(jetB);
  return{group,core,halo};
}

/* `avance` son cuadros de referencia transcurridos (ver tiempo.js). */
export function animateStellarObject(entry,time,avance=1){
  const group=entry.group||entry.object||entry;
  if(entry.kind==="quasar"||group.userData.kind==="quasar"){
    group.rotation.y+=.0015*avance;
    group.children.forEach((child,index)=>{if(child.geometry?.type==="RingGeometry")child.rotation.z+=(.003+index*.0004)*avance;if(child.geometry?.type==="PlaneGeometry")child.scale.y=1+Math.sin(time*2.4+index)*.18});
  }else{
    group.rotation.y+=.0006*avance;
    // El plasma hierve por su cuenta, independiente del giro del cuerpo.
    if(entry.core?.material?.uniforms?.uTime)entry.core.material.uniforms.uTime.value=time;
    const glow=entry.glow||group.children.find(child=>child.isSprite);
    if(glow)glow.scale.multiplyScalar(1+Math.sin(time*2.1)*.0008*avance);
  }
}
