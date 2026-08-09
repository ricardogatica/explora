import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { KNOWN_GALAXY_BY_SLUG, KNOWN_STAR_BY_SLUG } from "./data.js";
import { animateGalaxyObject, createMilkyWayObject } from "./galaxy-renderer.js";
import { animateStellarObject, createQuasarObject, createStarObject } from "./star-renderer.js";
import { addStarfield } from "./starfield.js";
import { crearReloj } from "@explora/compartido/tiempo.js";

const params=new URLSearchParams(location.search),slug=document.body.dataset.universeSlug||params.get("slug"),object=KNOWN_STAR_BY_SLUG[slug]||KNOWN_GALAXY_BY_SLUG[slug];
const title=document.getElementById("bodyTitle"),meta=document.getElementById("bodyMeta"),description=document.getElementById("bodyDescription"),table=document.getElementById("bodyTable"),interaction=document.getElementById("interactionText"),parentLink=document.getElementById("parentLink");
if(!object){
  const shell = document.createElement("div");
  shell.className = "hud";
  shell.innerHTML = `
    <section class="panel side-card">
      <p class="eyebrow">Archivo del universo</p>
      <h1>No encontramos ese objeto</h1>
      <p>El identificador <code id="slugEcho"></code> no corresponde a ninguna
      estrella ni galaxia de esta maqueta.</p>
      <div class="bottom-actions">
        <a class="btn" href="./indice.html">Ver el índice del universo</a>
        <a class="btn" href="./index.html">Volver a la escena 3D</a>
      </div>
    </section>`;
  shell.querySelector("#slugEcho").textContent = slug || "(vacío)";
  document.body.replaceChildren(shell);
  throw new Error(`Universe object not found: ${slug}`);
}
title.textContent=object.name;meta.textContent=`${object.type} · ${object.constellation}`;description.textContent=object.description;interaction.textContent=object.behavior||"Objeto astronómico integrado en la vista ampliada del universo.";parentLink.style.display="none";
table.innerHTML=`<div class="cell"><strong>Tipo</strong><span>${object.kind==="quasar"?"Quásar / núcleo activo":object.kind==="galaxy"?"Galaxia":"Estrella"}</span></div><div class="cell"><strong>Ubicación</strong><span>${object.constellation}</span></div><div class="cell"><strong>Distancia</strong><span>${object.distance}</span></div><div class="cell"><strong>Edad / luz</strong><span>${object.age}</span></div>${object.diameter?`<div class="cell"><strong>Diámetro</strong><span>${object.diameter}</span></div>`:""}${object.region?`<div class="cell"><strong>Región</strong><span>${object.region}</span></div>`:""}${object.mass?`<div class="cell"><strong>Masa</strong><span>${object.mass}</span></div>`:""}${object.redshift?`<div class="cell"><strong>Corrimiento rojo</strong><span>${object.redshift}</span></div>`:""}<div class="cell wide"><strong>Escala espacial</strong><span>${object.distanceScale}: ${object.distanceLy.toLocaleString("es-CL")} años luz.</span></div><div class="cell wide"><strong>Comportamiento</strong><span>${object.behavior||object.description}</span></div>`;

const app=document.getElementById("app"),scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020617,0.0017);
// 38 grados, el mismo campo que el resto de vistas de detalle.
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,0.01,6000);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.autoRotate=object.kind!=="galaxy";controls.autoRotateSpeed=0.35;controls.enableZoom=object.kind!=="galaxy";scene.add(new THREE.AmbientLight(0x9bbcff,0.55));const key=new THREE.PointLight(0xffffff,object.kind==="quasar"?4.8:2.5,0,2);key.position.set(8,5,7);scene.add(key);const fill=new THREE.DirectionalLight(0x7dd3fc,.65);fill.position.set(-8,4,-8);scene.add(fill);
const cielo=addStarfield(scene,object.kind==="galaxy"?6:Math.max(object.size,4));
const group=new THREE.Group();scene.add(group);
const parts=object.kind==="galaxy"?createMilkyWayObject(object,{detail:true}):object.kind==="quasar"?createQuasarObject(object,{detail:true}):createStarObject(object,{detail:true});
group.add(parts.group);
/* 3,3 tamaños de distancia para estrellas y quasares: antes el suelo de 18
   dejaba diminutas a las estrellas pequeñas.

   La galaxia se queda a 840 y no se aleja para compensar el campo mas cerrado.
   Se intento y desaparecio: la escena tiene FogExp2 a 0.0017, que a 840 ya
   oscurece un 87% y a 1270 pasa al 99%. Con el campo de 38 grados la galaxia
   se ve algo mayor que antes, que es justo lo que se buscaba. */
const isGalaxy=object.kind==="galaxy",distance=isGalaxy?840:object.kind==="quasar"?object.size*3.6:object.size*3.3;
let targetDistance=distance,zoomVelocity=0;
camera.position.set(isGalaxy?-80:0,isGalaxy?170:object.size*0.15,distance);controls.target.set(0,0,0);controls.minDistance=isGalaxy?85:object.size*1.35;controls.maxDistance=isGalaxy?960:object.size*20;
function smoothRange(value,start,end){const t=THREE.MathUtils.clamp((value-start)/(end-start),0,1);return t*t*(3-2*t)}
function galaxySolarTarget(){return parts.solarMarker?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3()}
function updateGalaxyZoom(){
  if(!isGalaxy)return;
  if(Math.abs(zoomVelocity)>.001){targetDistance=THREE.MathUtils.clamp(targetDistance+zoomVelocity,controls.minDistance,controls.maxDistance);zoomVelocity*=.78}
  const normalized=1-(targetDistance-controls.minDistance)/(controls.maxDistance-controls.minDistance),focusStrength=smoothRange(normalized,.18,.82);
  const target=new THREE.Vector3().lerpVectors(new THREE.Vector3(),galaxySolarTarget(),focusStrength);
  controls.target.lerp(target,.08);
  const desired=controls.target.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(targetDistance));
  camera.position.lerp(desired,.06);
}
window.addEventListener("wheel",event=>{if(!isGalaxy)return;event.preventDefault();zoomVelocity+=THREE.MathUtils.clamp(event.deltaY,-160,160)*.75},{passive:false});
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
/* Ver tiempo.js: `avance` son cuadros de referencia, para que el giro no dependa
   del refresco de la pantalla. */
const reloj=crearReloj();
function animate(ms){const time=ms*.001,{segundos,avance}=reloj.paso(ms);cielo.update(segundos*1000);if(isGalaxy){animateGalaxyObject(parts,time,avance);updateGalaxyZoom()}else animateStellarObject(parts,time,avance);controls.update();renderer.render(scene,camera);requestAnimationFrame(animate)}
requestAnimationFrame(animate);
