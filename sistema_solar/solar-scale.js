import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA } from "./data.js";
import { createBodyMesh, createSaturnRings, createSunGlow } from "./body-renderer.js";
import { addStarfield } from "./starfield.js";

const app=document.getElementById("app"),facts=document.getElementById("scaleFacts"),scaleTitle=document.getElementById("scaleTitle"),scaleText=document.getElementById("scaleText"),resetScale=document.getElementById("resetScale");
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020617,0.0011);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.01,5000);camera.position.set(16,20,142);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enableZoom=false;controls.minDistance=2;controls.maxDistance=380;controls.target.set(10,0,0);
scene.add(new THREE.AmbientLight(0x8fb3ff,.58));const key=new THREE.PointLight(0xffffff,4.2,0,2);key.position.set(-30,18,24);scene.add(key);const fill=new THREE.DirectionalLight(0x7dd3fc,.7);fill.position.set(20,12,-16);scene.add(fill);

function makeLabel(text,bodyRadius){const canvas=document.createElement("canvas");canvas.width=512;canvas.height=160;const ctx=canvas.getContext("2d");ctx.fillStyle="rgba(248,250,252,.98)";ctx.font="900 54px Inter, sans-serif";ctx.textAlign="center";ctx.fillText(text,256,86);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));const scale=bodyRadius>25?7.4:Math.min(4.2,Math.max(1.25,bodyRadius*.65+1.15));sprite.scale.set(scale,scale*.32,1);return sprite}
/* Las estrellas se repartían dentro de una CAJA de 1200 unidades, así que
   muchas caían delante de los planetas y cerca de la cámara: se veían como
   cuadrados grandes flotando en primer plano. El cielo compartido las coloca
   en dos capas esféricas muy lejanas, detrás de todo, y con destello redondo. */
/* Radios ajustados a la niebla de esta escena (FogExp2 0.0011): más allá de
   unas 800 unidades no se ve nada, así que las capas se acercan en vez de
   quedarse en el rango por defecto, donde desaparecían del todo. */
const cielo=addStarfield(scene,1,{cerca:[170,380],lejos:[400,780],tamañoCerca:0.85,tamañoLejos:1.25});

const relativeRadius={sun:109,mercury:.383,venus:.949,earth:1,moon:.2724,mars:.532,jupiter:11.21,saturn:9.45,uranus:4.01,neptune:3.88};
const layout=[
  {slug:"sun",x:-70,unit:.37,labelOffset:18},
  {slug:"mercury",x:-22,unit:.68,labelOffset:2.8},
  {slug:"venus",x:-17,unit:.68,labelOffset:3.3},
  {slug:"earth",x:-12.4,unit:.68,labelOffset:3.5},
  {slug:"moon",x:-9.9,unit:.68,labelOffset:2.2},
  {slug:"mars",x:-7.2,unit:.68,labelOffset:3.0},
  {slug:"jupiter",x:5,unit:.68,labelOffset:8.6},
  {slug:"saturn",x:31,unit:.68,labelOffset:8.0},
  {slug:"uranus",x:50,unit:.68,labelOffset:5.1},
  {slug:"neptune",x:60,unit:.68,labelOffset:5}
];
const objects={},clickables=[];let selected=null,targetDistance=142,zoomVelocity=0;
layout.forEach(item=>{
  const body=BODY_DATA[item.slug],radius=relativeRadius[item.slug]*item.unit,group=new THREE.Group();group.position.set(item.x,0,0);group.userData.slug=item.slug;
  const mesh=createBodyMesh(body,item.slug,{scale:radius/body.radius,stage:"modern"});mesh.userData.slug=item.slug;mesh.userData.clickable=true;group.add(mesh);clickables.push(mesh);
  if(item.slug==="sun")group.add(createSunGlow(radius,1.08));
  if(item.slug==="saturn")mesh.add(createSaturnRings(radius,{texture:body.textures?.ring}));
  const label=makeLabel(body.name,radius);label.position.set(0,radius+item.labelOffset,0);label.userData.slug=item.slug;label.userData.clickable=true;group.add(label);clickables.push(label);
  scene.add(group);objects[item.slug]={group,mesh,body,radius,label};
});

function updatePanel(slug){const entry=objects[slug],body=entry.body;scaleTitle.textContent=body.name;scaleText.textContent=`${body.type}. Diámetro: ${body.diameter}. Esta vista compara tamaños relativos, no distancias orbitales.`;facts.innerHTML=`<div class="cell"><strong>Cuerpo</strong><span>${body.name}</span></div><div class="cell"><strong>Tipo</strong><span>${body.type}</span></div><div class="cell"><strong>Diámetro</strong><span>${body.diameter}</span></div><div class="cell"><strong>Satélites</strong><span>${body.moons}</span></div><div class="cell wide"><strong>Escala</strong><span>Radios relativos respecto a la Tierra; el Sol queda parcialmente fuera de cuadro para conservar comparación visual.</span></div>`}
function minZoomDistance(){if(!selected)return 58;const entry=objects[selected];return Math.max(entry.radius*(selected==="sun"?1.55:3.2),selected==="sun"?52:3.2)}
function clampTargetDistance(value){return THREE.MathUtils.clamp(value,minZoomDistance(),380)}
function focusOn(slug){selected=slug;const entry=objects[slug];controls.target.copy(entry.group.position);targetDistance=clampTargetDistance(Math.max(entry.radius*4.8,slug==="sun"?86:7));updatePanel(slug)}
function showOverview(){selected=null;controls.target.set(10,0,0);targetDistance=142;scaleTitle.textContent="Sistema Solar a escala";scaleText.textContent="Vista comparativa por tamaño relativo. Haz click en un planeta o satélite para acercarte.";facts.innerHTML=`<div class="cell"><strong>Escala</strong><span>Radio relativo a la Tierra</span></div><div class="cell"><strong>Distancias</strong><span>No orbitales</span></div><div class="cell wide"><strong>Interacción</strong><span>Click en cualquier cuerpo para hacer zoom y ver su detalle.</span></div>`}
function updateWheelZoom(){if(Math.abs(zoomVelocity)<.001)return;targetDistance=clampTargetDistance(targetDistance+zoomVelocity);zoomVelocity*=.78}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
window.addEventListener("pointerdown",event=>{pointer.x=event.clientX/innerWidth*2-1;pointer.y=-(event.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(clickables);if(hits.length)focusOn(hits[0].object.userData.slug)});
resetScale.addEventListener("click",()=>{zoomVelocity=0;showOverview()});
window.addEventListener("wheel",event=>{event.preventDefault();zoomVelocity+=THREE.MathUtils.clamp(event.deltaY,-160,160)*.025},{passive:false});
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let ultimoInstante=performance.now();
function animate(){const ahora=performance.now();cielo.update(ahora-ultimoInstante);ultimoInstante=ahora;updateWheelZoom();Object.values(objects).forEach(entry=>{entry.mesh.rotation.y+=entry.body.rotationSpeed*2.2});const desired=controls.target.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(targetDistance));camera.position.lerp(desired,.055);controls.update();renderer.render(scene,camera);requestAnimationFrame(animate)}
showOverview();requestAnimationFrame(animate);
