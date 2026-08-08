import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA } from "./data.js";
import { createBodyMesh, createSaturnRings, createSunGlow } from "./body-renderer.js";
import { addStarfield } from "./starfield.js";

const app=document.getElementById("app"),facts=document.getElementById("scaleFacts"),scaleTitle=document.getElementById("scaleTitle"),scaleText=document.getElementById("scaleText"),resetScale=document.getElementById("resetScale"),scalePanel=document.getElementById("scalePanel"),scaleFile=document.getElementById("scaleFile"),closeScale=document.getElementById("closeScale");
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020617,0.0011);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.01,5000);camera.position.set(16,20,142);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enableZoom=false;controls.minDistance=2;controls.maxDistance=380;controls.target.set(10,0,0);
scene.add(new THREE.AmbientLight(0x8fb3ff,.58));const key=new THREE.PointLight(0xffffff,4.2,0,2);key.position.set(-30,18,24);scene.add(key);const fill=new THREE.DirectionalLight(0x7dd3fc,.7);fill.position.set(20,12,-16);scene.add(fill);

/* `escalaFija` es para la Luna: el tamaño normal sale del radio del cuerpo con
   un mínimo de 1,25 unidades, pensado para leerse desde la vista general, y al
   lado de una luna de 0,18 unidades ese mínimo es un cartel siete veces más
   grande que ella. */
function makeLabel(text,bodyRadius,escalaFija=null){const canvas=document.createElement("canvas");canvas.width=512;canvas.height=160;const ctx=canvas.getContext("2d");ctx.fillStyle="rgba(248,250,252,.98)";ctx.font="900 54px Inter, sans-serif";ctx.textAlign="center";ctx.fillText(text,256,86);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));const scale=escalaFija??(bodyRadius>25?7.4:Math.min(4.2,Math.max(1.25,bodyRadius*.65+1.15)));sprite.scale.set(scale,scale*.32,1);return sprite}
/* Las estrellas se repartían dentro de una CAJA de 1200 unidades, así que
   muchas caían delante de los planetas y cerca de la cámara: se veían como
   cuadrados grandes flotando en primer plano. El cielo compartido las coloca
   en dos capas esféricas muy lejanas, detrás de todo, y con destello redondo. */
/* Radios ajustados a la niebla de esta escena (FogExp2 0.0011): más allá de
   unas 800 unidades no se ve nada, así que las capas se acercan en vez de
   quedarse en el rango por defecto, donde desaparecían del todo. */
const cielo=addStarfield(scene,1,{cerca:[170,380],lejos:[400,780],tamañoCerca:0.85,tamañoLejos:1.25});

const relativeRadius={sun:109,mercury:.383,venus:.949,earth:1,moon:.2724,mars:.532,jupiter:11.21,saturn:9.45,uranus:4.01,neptune:3.88};
/* Unidad de los planetas: cuántas unidades de escena mide un radio terrestre.
   El Sol usa la suya, más pequeña, porque con esta se saldría del todo. */
const UNIDAD=.68;
/* La Luna no está en la fila. Estaba entre la Tierra y Marte, del mismo tamaño
   que los planetas y con su propio hueco, como si fuera uno más: la fila
   compara planetas y ella es un satélite. Ahora orbita a la Tierra, que es
   donde se entiende lo que es. */
const layout=[
  {slug:"sun",x:-70,unit:.37,labelOffset:18},
  {slug:"mercury",x:-22,unit:UNIDAD,labelOffset:2.8},
  {slug:"venus",x:-17,unit:UNIDAD,labelOffset:3.3},
  {slug:"earth",x:-12.4,unit:UNIDAD,labelOffset:3.5},
  {slug:"mars",x:-7.2,unit:UNIDAD,labelOffset:3.0},
  {slug:"jupiter",x:5,unit:UNIDAD,labelOffset:8.6},
  {slug:"saturn",x:31,unit:UNIDAD,labelOffset:8.0},
  {slug:"uranus",x:50,unit:UNIDAD,labelOffset:5.1},
  {slug:"neptune",x:60,unit:UNIDAD,labelOffset:5}
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

/* La Luna, orbitando la Tierra.

   Su tamaño sí está a escala: 0,2724 radios terrestres, la cuarta parte de la
   Tierra. Su distancia no puede estarlo. La Luna está a unos 60 radios
   terrestres, que aquí serían 41 unidades, y entre la Tierra y Marte solo hay
   5,2: a escala real la Luna orbitaría más allá de Neptuno. Se acerca a 2,4
   unidades, que la deja fuera de la Tierra y lejos de Venus y de Marte. Esta
   vista ya avisa de que no representa distancias.

   El pivote es lo que gira; la Luna va colgada de él a su distancia. Así la
   órbita es una rotación y no hay que calcular seno y coseno en cada cuadro. */
const RADIO_ORBITA_LUNA=2.4;
/* Una vuelta cada 40 segundos: se ve que se mueve sin que el movimiento
   distraiga de la comparación, que es de lo que va la vista.

   En radianes por SEGUNDO, no por cuadro. Con un incremento fijo por cuadro la
   velocidad depende del refresco de la pantalla: medido en este navegador, que
   va a 122 cuadros por segundo, la vuelta habría durado 20 segundos en vez de
   40, y en un monitor de 60 Hz, 40. */
const VELOCIDAD_ORBITA_LUNA=Math.PI*2/40;
const pivoteLuna=new THREE.Group();
(()=>{
  const body=BODY_DATA.moon,radius=relativeRadius.moon*UNIDAD;
  const group=new THREE.Group();group.position.set(RADIO_ORBITA_LUNA,0,0);
  const mesh=createBodyMesh(body,"moon",{scale:radius/body.radius,stage:"modern"});
  mesh.userData.slug="moon";mesh.userData.clickable=true;group.add(mesh);clickables.push(mesh);
  const label=makeLabel(body.name,radius,.85);label.position.set(0,radius+.55,0);
  label.userData.slug="moon";label.userData.clickable=true;group.add(label);clickables.push(label);
  pivoteLuna.add(group);
  objects.earth.group.add(pivoteLuna);

  // El trazo de la órbita: sin él la Luna parece un planeta pequeño al lado.
  const puntos=[];
  for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;puntos.push(new THREE.Vector3(Math.cos(a)*RADIO_ORBITA_LUNA,0,Math.sin(a)*RADIO_ORBITA_LUNA))}
  objects.earth.group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(puntos),new THREE.LineBasicMaterial({color:0x94a3b8,transparent:true,opacity:.3})));

  objects.moon={group,mesh,body,radius,label};
})();

/* La ficha del cuerpo. Antes se repartía entre las dos tarjetas —el título en la
   nota de la derecha y la tabla dentro de la tarjeta de navegación—, así que la
   tarjeta izquierda mezclaba dos cosas: cómo moverse por el sitio y qué es
   Marte. Ahora la ficha está entera aquí y solo aparece al pulsar un cuerpo. */
function updatePanel(slug){
  const entry=objects[slug],body=entry.body;
  scaleTitle.textContent=body.name;
  scaleText.textContent=`${body.type}. Diámetro: ${body.diameter}.`;
  facts.innerHTML=`<div class="cell"><strong>Tipo</strong><span>${body.type}</span></div><div class="cell"><strong>Diámetro</strong><span>${body.diameter}</span></div><div class="cell"><strong>Radio comparado</strong><span>${slug==="earth"?"Es la unidad de la escala":`${relativeRadius[slug].toLocaleString("es")} veces la Tierra`}</span></div><div class="cell"><strong>Satélites</strong><span>${body.moons}</span></div>`;
  scaleFile.href=`${slug}.html`;
  scaleFile.textContent=`Abrir archivo de ${body.name}`;
  scalePanel.hidden=false;
}
function minZoomDistance(){if(!selected)return 58;const entry=objects[selected];return Math.max(entry.radius*(selected==="sun"?1.55:3.2),selected==="sun"?52:3.2)}
function clampTargetDistance(value){return THREE.MathUtils.clamp(value,minZoomDistance(),380)}
/* La posición en el mundo, no la local: la Luna cuelga del pivote que la hace
   orbitar, así que su group.position es su distancia a la Tierra, no su sitio en
   la escena. Con la local, enfocarla llevaba la cámara junto al Sol. */
function posicionEnEscena(entry){return entry.group.getWorldPosition(new THREE.Vector3())}
function focusOn(slug){selected=slug;const entry=objects[slug];controls.target.copy(posicionEnEscena(entry));targetDistance=clampTargetDistance(Math.max(entry.radius*4.8,slug==="sun"?86:7));updatePanel(slug)}
/* El reset recupera también la posición inicial de la cámara, no solo la
   distancia: los cuerpos están alineados en X, así que si se vuelve desde el
   detalle de Neptuno conservando su dirección, la fila se ve de canto y los diez
   cuerpos quedan uno detrás de otro. */
function showOverview(){selected=null;controls.target.set(10,0,0);targetDistance=142;camera.position.set(16,20,142);scalePanel.hidden=true}
function updateWheelZoom(){if(Math.abs(zoomVelocity)<.001)return;targetDistance=clampTargetDistance(targetDistance+zoomVelocity);zoomVelocity*=.78}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
/* Solo el lienzo elige cuerpo: pulsar la ficha o los botones no debe lanzar un
   raycast que cierre lo que se acaba de abrir. */
window.addEventListener("pointerdown",event=>{if(event.target!==renderer.domElement)return;pointer.x=event.clientX/innerWidth*2-1;pointer.y=-(event.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(clickables);if(hits.length)focusOn(hits[0].object.userData.slug);else scalePanel.hidden=true});
resetScale.addEventListener("click",()=>{zoomVelocity=0;showOverview()});
closeScale.addEventListener("click",()=>{scalePanel.hidden=true});
window.addEventListener("wheel",event=>{event.preventDefault();zoomVelocity+=THREE.MathUtils.clamp(event.deltaY,-160,160)*.025},{passive:false});
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let ultimoInstante=performance.now();
function animate(){
  const ahora=performance.now(),transcurrido=ahora-ultimoInstante;cielo.update(transcurrido);ultimoInstante=ahora;
  updateWheelZoom();
  Object.values(objects).forEach(entry=>{entry.mesh.rotation.y+=entry.body.rotationSpeed*2.2});
  // Acotado: al volver de una pestaña en segundo plano el intervalo llega en
  // segundos y la Luna daría un salto por su órbita.
  pivoteLuna.rotation.y+=VELOCIDAD_ORBITA_LUNA*Math.min(transcurrido,120)/1000;
  /* Con la Luna enfocada, la cámara la sigue: es lo único que se mueve en esta
     escena, y sin esto se iría del cuadro en cuanto avanzara por su órbita.

     La cámara se desplaza lo mismo que el objetivo, no solo el objetivo. Moviendo
     únicamente el objetivo, la dirección cámara→objetivo cambia en cada cuadro y
     la cámara acaba dando la vuelta alrededor de la Luna: en una órbita se
     colocaba de forma que el Sol —que aquí mide 40 unidades de radio— ocupaba
     media pantalla. Desplazando las dos por igual, el encuadre es el que se
     eligió al pulsar y la Luna simplemente no se escapa. */
  if(selected){
    const objetivo=posicionEnEscena(objects[selected]),desplazamiento=objetivo.clone().sub(controls.target);
    controls.target.add(desplazamiento);camera.position.add(desplazamiento);
  }
  const desired=controls.target.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(targetDistance));
  camera.position.lerp(desired,.055);controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);
}
showOverview();requestAnimationFrame(animate);
