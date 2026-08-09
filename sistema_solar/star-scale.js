import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA, KNOWN_STAR_BY_SLUG } from "./data.js";
import { getGlowTexture, starSurfaceMaterial } from "./star-renderer.js";
import { addStarfield } from "./starfield.js";
import { crearReloj, suavizado } from "@explora/compartido/tiempo.js";

const app=document.getElementById("app"),facts=document.getElementById("starFacts"),panel=document.getElementById("starPanel"),titleEl=document.getElementById("starTitle"),textEl=document.getElementById("starText"),fileEl=document.getElementById("starFile"),closeEl=document.getElementById("closeStar"),resetEl=document.getElementById("resetStars");

/* El Sol no está en el catálogo de estrellas —vive en BODY_DATA, con los
   planetas— pero es la unidad de esta vista, así que se compone aquí a partir de
   sus propios datos. Su radio es 1 por definición: 1 R☉ = 696.340 km. */
const SOL={slug:"sun",name:BODY_DATA.sun.name,type:BODY_DATA.sun.type,radioSolar:1,color:BODY_DATA.sun.color,file:"sun.html",distance:"—",description:`${BODY_DATA.sun.description} Su radio, 696.340 km, es la unidad con la que se miden las demás estrellas.`};

function estrella(slug){
  if(slug==="sun")return SOL;
  const star=KNOWN_STAR_BY_SLUG[slug];
  return {slug,name:star.name,type:star.type,radioSolar:star.radioSolar,radioNota:star.radioNota,color:star.color,file:star.file||`${slug}.html`,distance:star.distance,description:star.description};
}

/* Tres escalones, porque en una sola escala esta comparación no se puede ver:
   entre Próxima Centauri (0,15 R☉) y Betelgeuse (764) hay un factor 4.950, y si
   Betelgeuse midiera 9 unidades en pantalla, Próxima mediría 0,0018 —menos de un
   píxel—. Es el recurso de las láminas clásicas de tamaños estelares.

   Cada escalón repite la mayor del anterior, y esa repetición es lo que hace
   legible el salto: Vega es la más grande de la primera fila y la más pequeña de
   la segunda, así que se ve de un vistazo cuánto se ha cambiado de escala. */
const ESCALONES=[
  {titulo:"Enanas y estrellas como el Sol",soles:["proxima-centauri","sun","sirius","vega"]},
  {titulo:"Gigantes",soles:["vega","acrux","polaris","rigel"]},
  {titulo:"Supergigantes",soles:["rigel","antares","betelgeuse"]}
];
const RADIO_EN_PANTALLA=9,SEPARACION=3.4,ALTO_FILA=27;

/* Rotación de las estrellas.

   Los periodos reales no caben en una vista: Vega gira sobre sí misma en medio
   día y Betelgeuse tarda unos cinco años. Poner esa proporción dejaría las
   supergigantes congeladas, que es como estaban hasta ahora.

   Lo que sí se conserva es el hecho cualitativo, que es el que importa aquí:
   cuanto más grande la estrella, más despacio gira. El periodo crece con la
   raíz cuarta del radio, así que Betelgeuse tarda cinco veces más que el Sol en
   vez de setecientas. Es una decisión de legibilidad, no una medida.

   La velocidad es en radianes por SEGUNDO, no por cuadro. Sumar un incremento
   fijo en cada cuadro ata la escena al refresco de la pantalla: medido en este
   navegador, que va a 122 cuadros por segundo, el Sol daba la vuelta en 17
   segundos en vez de 34, y en un monitor de 60 Hz habría girado a la mitad. */
const VUELTA_DEL_SOL=34;   // segundos por vuelta del Sol
function velocidadDeGiro(radioSolar){
  return Math.PI*2/(VUELTA_DEL_SOL*Math.pow(radioSolar,.25));
}

const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020617,0.0009);
const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,0.01,4000);camera.position.set(0,6,132);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enableZoom=false;controls.minDistance=3;controls.maxDistance=420;controls.target.set(0,0,0);
scene.add(new THREE.AmbientLight(0xdbeafe,.35));
const cielo=addStarfield(scene,1,{cerca:[190,420],lejos:[440,860],tamañoCerca:.8,tamañoLejos:1.2});

function makeLabel(nombre,medida,radioDibujado){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=180;
  const ctx=canvas.getContext("2d");ctx.textAlign="center";
  ctx.fillStyle="rgba(248,250,252,.98)";ctx.font="900 52px Inter, sans-serif";ctx.fillText(nombre,256,64);
  ctx.fillStyle="rgba(125,211,252,.96)";ctx.font="800 40px Inter, sans-serif";ctx.fillText(medida,256,124);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  /* El mínimo es lo que hace legible «Próxima Centauri», que se dibuja como un
     punto de medio píxel de radio: su nombre no puede encogerse con ella. */
  const escala=THREE.MathUtils.clamp(radioDibujado*.9+2.4,5.6,9);
  sprite.scale.set(escala,escala*.35,1);return sprite;
}
/* El rótulo de la fila se mide antes de dibujarlo: con un lienzo de ancho fijo,
   «ENANAS Y ESTRELLAS COMO EL SOL · ESCALA DE REFERENCIA» se cortaba a media
   palabra. El sprite se estira en la misma proporción que el lienzo, así que el
   texto no sale deformado por largo que sea. */
function makeRowLabel(texto){
  const rotulo=texto.toUpperCase(),fuente="900 40px Inter, sans-serif",alto=96;
  const medidor=document.createElement("canvas").getContext("2d");medidor.font=fuente;
  const ancho=Math.ceil(medidor.measureText(rotulo).width)+16;
  const canvas=document.createElement("canvas");canvas.width=ancho;canvas.height=alto;
  const ctx=canvas.getContext("2d");ctx.fillStyle="rgba(167,139,250,.92)";ctx.font=fuente;ctx.fillText(rotulo,8,60);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,opacity:.9,depthWrite:false}));
  const altoEnEscena=3.4;
  sprite.scale.set(altoEnEscena*ancho/alto,altoEnEscena,1);sprite.center.set(0,.5);return sprite;
}

const numero=valor=>valor.toLocaleString("es",{maximumFractionDigits:valor<10?2:0});

/* Cuántas veces cabe una en otra, por volumen. Va al cubo del radio, y es la
   cifra que sorprende: Betelgeuse mide 764 veces más de ancho que el Sol, pero
   por dentro le caben 445 millones. */
function veces(valor){
  if(valor>=1e6)return `${numero(Math.round(valor/1e6))} millones de veces`;
  return `${numero(valor)} veces`;
}

/* Comparar con el Sol tiene dos sentidos según el lado en que caiga la estrella:
   Betelgeuse contiene Soles, y al Sol le caben Próximas dentro. Decir «0,004
   veces» sería exacto e ilegible. */
function comparacionDeVolumen(sol){
  const razon=Math.pow(sol.radioSolar,3);
  return razon>=1
    ? ["Soles que caben dentro",veces(razon)]
    : [`${sol.name} que caben en el Sol`,veces(1/razon)];
}

const objetos={},clickables=[],materiales=[];let seleccionada=null,targetDistance=132,zoomVelocity=0;
/* Extensión real de lo dibujado, que se va midiendo al montar las filas. La
   distancia de la vista general sale de aquí y no de un número escrito a mano:
   así llena el cuadro en apaisado y sigue cabiendo en vertical, donde lo que
   aprieta es el ancho. */
let mitadAncho=0,mitadAlto=0;
const unidadDeReferencia=RADIO_EN_PANTALLA/Math.max(...ESCALONES[0].soles.map(slug=>estrella(slug).radioSolar));

ESCALONES.forEach((escalon,fila)=>{
  const soles=escalon.soles.map(estrella);
  const unidad=RADIO_EN_PANTALLA/Math.max(...soles.map(s=>s.radioSolar));
  const radios=soles.map(s=>s.radioSolar*unidad);
  const ancho=radios.reduce((total,r)=>total+r*2,0)+SEPARACION*(soles.length-1);
  const y=(1-fila)*ALTO_FILA;
  let x=-ancho/2;
  mitadAncho=Math.max(mitadAncho,ancho/2);
  // El rótulo de la fila vive 7,5 unidades por encima del radio mayor.
  mitadAlto=Math.max(mitadAlto,Math.abs(y)+RADIO_EN_PANTALLA+9);

  const reduccion=Math.round(unidadDeReferencia/unidad);
  const rotulo=makeRowLabel(fila===0?`${escalon.titulo} · escala de referencia`:`${escalon.titulo} · escala 1:${reduccion}`);
  // .position es de solo lectura en Object3D: se copia dentro, no se reemplaza.
  rotulo.position.set(-ancho/2,y+RADIO_EN_PANTALLA+7.5,0);
  scene.add(rotulo);

  soles.forEach((sol,indice)=>{
    const radio=radios[indice];x+=radio;
    const grupo=new THREE.Group();grupo.position.set(x,y,0);
    /* La misma clave para la misma estrella en dos filas distintas sobreescribiría
       la anterior: la repetida se guarda con su fila para que enfocar la lleve a
       la que se ha pulsado y no a su gemela. */
    const clave=`${sol.slug}@${fila}`;
    const material=starSurfaceMaterial(sol.color,{spots:sol.radioSolar>100?.34:.2});
    materiales.push(material);
    const malla=new THREE.Mesh(new THREE.SphereGeometry(radio,64,64),material);
    malla.userData.clave=clave;malla.userData.clickable=true;grupo.add(malla);clickables.push(malla);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:sol.color,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));
    halo.scale.set(radio*4.2,radio*4.2,1);grupo.add(halo);
    const etiqueta=makeLabel(sol.name,`${numero(sol.radioSolar)} R☉`,radio);
    etiqueta.position.set(0,radio+2.4,0);etiqueta.userData.clave=clave;etiqueta.userData.clickable=true;grupo.add(etiqueta);clickables.push(etiqueta);
    scene.add(grupo);objetos[clave]={grupo,sol,radio,malla,velocidad:velocidadDeGiro(sol.radioSolar)};
    x+=radio+SEPARACION;
  });
});

function mostrarFicha(clave){
  const {sol,radio}=objetos[clave];seleccionada=clave;
  titleEl.textContent=sol.name;
  textEl.textContent=sol.radioNota?`${sol.description} ${sol.radioNota}`:sol.description;
  facts.replaceChildren(...[
    ["Tipo",sol.type],
    ["Radio",`${numero(sol.radioSolar)} R☉`],
    ["De ancho frente al Sol",sol.slug==="sun"?"Es la unidad de la escala":veces(sol.radioSolar)],
    comparacionDeVolumen(sol),
    ["Distancia",sol.distance]
  ].map(([titulo,valor])=>{
    const celda=document.createElement("div");celda.className="cell";
    const strong=document.createElement("strong");strong.textContent=titulo;
    const span=document.createElement("span");span.textContent=valor;
    celda.append(strong,span);return celda;
  }));
  fileEl.href=sol.file;fileEl.textContent=`Abrir archivo de ${sol.name}`;
  panel.hidden=false;
  controls.target.copy(objetos[clave].grupo.position);
  targetDistance=THREE.MathUtils.clamp(radio*5.4,14,420);
}
/* Distancia a la que las tres filas caben enteras. Se resuelven las dos
   restricciones —alto y ancho— y manda la que quede más lejos: en apaisado suele
   ser el alto, y en una pantalla estrecha, el ancho. */
function distanciaGeneral(){
  const mitadFov=THREE.MathUtils.degToRad(camera.fov)/2;
  return Math.max(mitadAlto/Math.tan(mitadFov),mitadAncho/(Math.tan(mitadFov)*camera.aspect))*1.06;
}
function vistaGeneral(){
  seleccionada=null;controls.target.set(0,0,0);targetDistance=distanciaGeneral();
  /* La dirección también vuelve al frente, no solo la distancia. Al enfocar una
     estrella la cámara se queda mirando desde donde la vio, y como las tres
     filas están alineadas en X, recuperar solo la distancia dejaba la escena
     vista de canto: las nueve estrellas una detrás de otra. */
  camera.position.set(0,6,targetDistance);
  panel.hidden=true;
}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
window.addEventListener("pointerdown",event=>{
  if(event.target!==renderer.domElement)return;
  pointer.x=event.clientX/innerWidth*2-1;pointer.y=-(event.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(clickables);
  if(hits.length)mostrarFicha(hits[0].object.userData.clave);else panel.hidden=true;
});
closeEl.addEventListener("click",()=>{panel.hidden=true});
resetEl.addEventListener("click",()=>{zoomVelocity=0;vistaGeneral()});
window.addEventListener("wheel",event=>{event.preventDefault();zoomVelocity+=THREE.MathUtils.clamp(event.deltaY,-160,160)*.03},{passive:false});
window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
  // Girar el teléfono cambia qué restricción manda, así que el encuadre general
  // se recalcula; con una estrella elegida no se toca, que ahí manda el zoom.
  if(!seleccionada)targetDistance=distanciaGeneral();
});

const reloj=crearReloj();
function animate(ms){
  const {segundos,avance}=reloj.paso(ms);
  cielo.update(segundos*1000);
  if(Math.abs(zoomVelocity)>.001){targetDistance=THREE.MathUtils.clamp(targetDistance+zoomVelocity*avance,seleccionada?objetos[seleccionada].radio*1.5+2:24,420);zoomVelocity*=Math.pow(.78,avance)}
  materiales.forEach(material=>{material.uniforms.uTime.value=ms*.001});
  Object.values(objetos).forEach(entrada=>{entrada.malla.rotation.y+=entrada.velocidad*segundos});
  const deseada=controls.target.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(targetDistance));
  camera.position.lerp(deseada,suavizado(.055,avance));controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);
}
vistaGeneral();requestAnimationFrame(animate);
