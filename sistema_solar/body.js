import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA, ROTATION_SLOWDOWN, SATELLITE_SLOWDOWN } from "./data.js";
import { createBodyMesh, createSaturnRings, createSunGlow, hasPhotorealTextures, loadPhotorealBody } from "./body-renderer.js";
import { addStarfield } from "./starfield.js";

const slug=document.body.dataset.slug,body=BODY_DATA[slug],parent=body.parent?BODY_DATA[body.parent]:null;
const title=document.getElementById("bodyTitle"),meta=document.getElementById("bodyMeta"),description=document.getElementById("bodyDescription"),table=document.getElementById("bodyTable"),interaction=document.getElementById("interactionText"),parentLink=document.getElementById("parentLink");
title.textContent=body.name;meta.textContent=body.type;description.textContent=body.description;interaction.textContent=body.interaction;
if(parent){parentLink.href=`${parent.slug}.html`;parentLink.textContent=`Ver archivo de ${parent.name}`}else{parentLink.style.display="none"}
const satelliteSummary=body.satellites?.length?`<div class="cell wide"><strong>Lunas principales</strong><span>${body.satellites.map(item=>`${item.name}: ${item.type}, ${item.diameter}, ${item.distance}`).join(" · ")}</span></div>`:"";
table.innerHTML=`<div class="cell"><strong>Gravedad</strong><span>${body.gravity}</span></div><div class="cell"><strong>Equivalencia terrestre</strong><span>${body.gravityFactor}</span></div><div class="cell"><strong>Diámetro</strong><span>${body.diameter}</span></div><div class="cell"><strong>Distancia al Sol</strong><span>${body.distance}</span></div><div class="cell"><strong>Año orbital</strong><span>${body.year}</span></div><div class="cell"><strong>Día / rotación</strong><span>${body.day}</span></div><div class="cell"><strong>Temperatura</strong><span>${body.temperature}</span></div><div class="cell"><strong>Satélites</strong><span>${body.moons}</span></div>${satelliteSummary}<div class="cell wide"><strong>Línea temporal propia</strong><span>${body.timelineStages.map(item=>`${item.from}: ${item.title}`).join(" · ")}</span></div>`;

const app=document.getElementById("app"),scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x020617,0.0022);
// 38 grados y no 55: el cuerpo llena el encuadre y se reduce la deformacion
// de perspectiva. Es el mismo campo que usa el prototipo de la Tierra.
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,0.01,4000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
// Gestión de color para las 10 fichas: sin tone mapping los colores salen
// lavados y las texturas se emborronan al mirarlas en ángulo. Mejora también
// a los nueve cuerpos que siguen con textura procedural, sin descargar nada.
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const maxAnisotropy=renderer.capabilities.getMaxAnisotropy();
app.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.autoRotate=true;controls.autoRotateSpeed=0.4/ROTATION_SLOWDOWN;
/* Dos esquemas de luz, porque cada uno sirve a un tipo de textura distinto.

   Las texturas procedurales necesitan luz de relleno generosa: son planas y sin
   ella no se lee el volumen. Las fotorrealistas necesitan lo contrario, un Sol
   duro y casi nada de relleno, porque su realismo vive en el contraste del
   terminador y en las luces de ciudad de la cara oscura. Iluminar una textura
   fotográfica con el esquema plano la deja lechosa y borra la noche. */
const usaTexturasReales=hasPhotorealTextures(body);
const sunPosition=new THREE.Vector3(6,3,4);
let key;
if(usaTexturasReales){
  key=new THREE.DirectionalLight(0xffffff,3.9);
  key.position.copy(sunPosition);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0x9cc7ff,0x020408,0.055));
}else{
  // El ambiente azulado del sitio funciona con los planetas de colores, pero
  // sobre la Luna es falso: es roca gris, y el tinte la volvía celeste.
  const esRocaGris=slug==="moon"||slug==="mercury";
  scene.add(new THREE.AmbientLight(esRocaGris?0xbfc3cb:0x91b4ff,esRocaGris?0.42:0.6));
  key=new THREE.PointLight(0xffffff,slug==="sun"?4.0:2.4,0,2);
  key.position.copy(sunPosition);
  scene.add(key);
  const fill=new THREE.DirectionalLight(esRocaGris?0xcdd3dd:0x7dd3fc,esRocaGris?0.35:0.7);
  fill.position.set(-6,2,-4);
  scene.add(fill);
}

const cielo=addStarfield(scene,body.radius);

function makeLabel(text,{scale=[.72,.22,1]}={}){
  const canvas=document.createElement("canvas");canvas.width=384;canvas.height=96;
  const ctx=canvas.getContext("2d");ctx.fillStyle="rgba(248,250,252,.94)";ctx.font="800 38px Inter, sans-serif";ctx.fillText(text,18,58);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  label.scale.set(...scale);return label;
}

const group=new THREE.Group();scene.add(group);
let bodyMesh,rings,glow;
const satelliteObjects=[];
const detailStage=slug==="earth"?"modern":"modern";
bodyMesh=createBodyMesh(body,slug,{stage:detailStage});
group.add(bodyMesh);

/* Carga progresiva: la procedural se ve desde el primer fotograma y la
   fotorrealista la sustituye cuando sus mapas han llegado. Si la descarga
   falla, se queda la procedural: nadie ve una esfera negra. */
let cloudLayer=null;
if(usaTexturasReales){
  const sunDirection={value:sunPosition.clone().normalize()};
  loadPhotorealBody(body,{radius:body.radius,sunDirection,anisotropy:maxAnisotropy})
    .then(photoreal=>{
      group.remove(bodyMesh);
      bodyMesh.geometry.dispose();bodyMesh.material.dispose();
      photoreal.group.rotation.copy(bodyMesh.rotation);
      group.add(photoreal.group);
      bodyMesh=photoreal.group;
      cloudLayer=photoreal.cloudLayer;
    })
    .catch(error=>{
      console.warn(`No se pudieron cargar las texturas de ${body.name}; se mantiene la vista procedural.`,error);
    });
}
if(slug==="sun"){glow=createSunGlow(body.radius,1.16);group.add(glow)}
if(slug==="saturn"){rings=createSaturnRings(body.radius);bodyMesh.add(rings)}
if(body.satellites?.length){
  body.satellites.forEach((satellite,index)=>{
    const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2;return new THREE.Vector3(Math.cos(a)*satellite.orbitRadius,Math.sin(a)*satellite.orbitRadius*.08,Math.sin(a)*satellite.orbitRadius)})),new THREE.LineBasicMaterial({color:0x94a3b8,transparent:true,opacity:.26}));
    group.add(orbit);
    const moonGroup=new THREE.Group();
    const materialLuna=new THREE.MeshStandardMaterial({color:satellite.texture?0xffffff:satellite.color,roughness:1});
    if(satellite.texture){
      // Si el satélite declara mapa, se carga igual que los cuerpos mayores.
      new THREE.TextureLoader().load(satellite.texture,textura=>{
        textura.colorSpace=THREE.SRGBColorSpace;
        textura.anisotropy=maxAnisotropy;
        materialLuna.map=textura;
        materialLuna.needsUpdate=true;
      },undefined,()=>{ materialLuna.color.setHex(satellite.color); });
    }
    const moon=new THREE.Mesh(new THREE.SphereGeometry(satellite.radius,48,48),materialLuna);
    moonGroup.add(moon);
    const label=makeLabel(satellite.name);label.position.set(0,satellite.radius+.22,0);moonGroup.add(label);
    group.add(moonGroup);
    satelliteObjects.push({group:moonGroup,mesh:moon,orbit,satellite,angle:index*.9});
  });
}

/* Encuadre.

   Sin lunas: 3,3 radios, como el prototipo de la Tierra, de forma que el cuerpo
   llene la pantalla.

   Con lunas manda la órbita más lejana, no el planeta. Antes no: Calisto orbita
   Júpiter a 3,8 y la cámara se quedaba a 3,13, así que las cuatro lunas
   galileanas caían fuera del encuadre y no había manera de verlas. El planeta
   sale más pequeño, que es el precio de ver su sistema. */
const alcance=body.satellites?.length
  ? Math.max(...body.satellites.map(s=>s.orbitRadius+s.radius))
  : 0;
const focusDistance=alcance
  ? alcance*3.4
  : body.radius*(slug==="sun"?3.6:3.3);
/* Con lunas la cámara se eleva sobre el plano orbital. A ras de plano las
   órbitas se ven como líneas rectas y las lunas parecen una fila de bolas;
   desde arriba se leen como órbitas. Sin lunas se mantiene casi frontal, que
   es el mejor angulo para mirar una superficie. */
camera.position.set(0,focusDistance*(alcance?0.34:0.06),focusDistance);
controls.target.set(0,0,0);controls.minDistance=body.radius*1.35;controls.maxDistance=Math.max(body.radius,alcance)*20;

window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let ultimoInstante=performance.now();
function animate(){
  const ahora=performance.now(),dt=ahora-ultimoInstante;ultimoInstante=ahora;
  cielo.update(dt);
  group.rotation.y+=.0003/ROTATION_SLOWDOWN;
  bodyMesh.rotation.y+=body.rotationSpeed*(slug==="sun"?2.5:2.1)/ROTATION_SLOWDOWN;
  // Las nubes van algo más rápido que la superficie: la atmósfera no rota
  // solidaria con el suelo.
  if(cloudLayer)cloudLayer.rotation.y+=body.rotationSpeed*0.34/ROTATION_SLOWDOWN;
  satelliteObjects.forEach(entry=>{
    entry.angle+=entry.satellite.orbitSpeed/SATELLITE_SLOWDOWN;
    entry.group.position.set(Math.cos(entry.angle)*entry.satellite.orbitRadius,Math.sin(entry.angle)*entry.satellite.orbitRadius*.08,Math.sin(entry.angle)*entry.satellite.orbitRadius);
    entry.mesh.rotation.y+=.003/SATELLITE_SLOWDOWN;
  });
  if(glow)glow.rotation.y-=0.0006;
  if(rings)rings.rotation.z+=0.0008;
  controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
