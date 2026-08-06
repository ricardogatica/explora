import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA } from "./data.js";
import { createBodyMesh, createSaturnRings, createSunGlow } from "./body-renderer.js";

const slug=document.body.dataset.slug,body=BODY_DATA[slug],parent=body.parent?BODY_DATA[body.parent]:null;
const title=document.getElementById("bodyTitle"),meta=document.getElementById("bodyMeta"),description=document.getElementById("bodyDescription"),table=document.getElementById("bodyTable"),interaction=document.getElementById("interactionText"),parentLink=document.getElementById("parentLink");
title.textContent=body.name;meta.textContent=body.type;description.textContent=body.description;interaction.textContent=body.interaction;
if(parent){parentLink.href=`${parent.slug}.html`;parentLink.textContent=`Ver archivo de ${parent.name}`}else{parentLink.style.display="none"}
const satelliteSummary=body.satellites?.length?`<div class="cell wide"><strong>Lunas principales</strong><span>${body.satellites.map(item=>`${item.name}: ${item.type}, ${item.diameter}, ${item.distance}`).join(" · ")}</span></div>`:"";
table.innerHTML=`<div class="cell"><strong>Gravedad</strong><span>${body.gravity}</span></div><div class="cell"><strong>Equivalencia terrestre</strong><span>${body.gravityFactor}</span></div><div class="cell"><strong>Diámetro</strong><span>${body.diameter}</span></div><div class="cell"><strong>Distancia al Sol</strong><span>${body.distance}</span></div><div class="cell"><strong>Año orbital</strong><span>${body.year}</span></div><div class="cell"><strong>Día / rotación</strong><span>${body.day}</span></div><div class="cell"><strong>Temperatura</strong><span>${body.temperature}</span></div><div class="cell"><strong>Satélites</strong><span>${body.moons}</span></div>${satelliteSummary}<div class="cell wide"><strong>Línea temporal propia</strong><span>${body.timelineStages.map(item=>`${item.from}: ${item.title}`).join(" · ")}</span></div>`;

const app=document.getElementById("app"),scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x020617,0.0022);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.01,4000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.autoRotate=true;controls.autoRotateSpeed=0.4;
scene.add(new THREE.AmbientLight(0x91b4ff,0.6));
const key=new THREE.PointLight(0xffffff,slug==="sun"?4.0:2.4,0,2);key.position.set(6,3,4);scene.add(key);
const fill=new THREE.DirectionalLight(0x7dd3fc,0.7);fill.position.set(-6,2,-4);scene.add(fill);

function starField(count,radius,size,opacity){
  const g=new THREE.BufferGeometry(),pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){const r=radius*(0.3+Math.random()*0.7),a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);pos[i*3]=r*Math.sin(b)*Math.cos(a);pos[i*3+1]=r*Math.sin(b)*Math.sin(a);pos[i*3+2]=r*Math.cos(b)}
  g.setAttribute("position",new THREE.BufferAttribute(pos,3));
  return new THREE.Points(g,new THREE.PointsMaterial({color:0xdbeafe,size,transparent:true,opacity,depthWrite:false}));
}
scene.add(starField(4200,1800,1.2,0.85));

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
if(slug==="sun"){glow=createSunGlow(body.radius,1.16);group.add(glow)}
if(slug==="saturn"){rings=createSaturnRings(body.radius);bodyMesh.add(rings)}
if(body.satellites?.length){
  body.satellites.forEach((satellite,index)=>{
    const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2;return new THREE.Vector3(Math.cos(a)*satellite.orbitRadius,Math.sin(a)*satellite.orbitRadius*.08,Math.sin(a)*satellite.orbitRadius)})),new THREE.LineBasicMaterial({color:0x94a3b8,transparent:true,opacity:.26}));
    group.add(orbit);
    const moonGroup=new THREE.Group();
    const moon=new THREE.Mesh(new THREE.SphereGeometry(satellite.radius,32,32),new THREE.MeshStandardMaterial({color:satellite.color,roughness:1}));
    moonGroup.add(moon);
    const label=makeLabel(satellite.name);label.position.set(0,satellite.radius+.22,0);moonGroup.add(label);
    group.add(moonGroup);
    satelliteObjects.push({group:moonGroup,mesh:moon,orbit,satellite,angle:index*.9});
  });
}

const focusDistance=Math.max(body.radius*(slug==="sun"?5:8),slug==="moon"?3.2:4.2);
camera.position.set(0,body.radius*1.15,focusDistance);
controls.target.set(0,0,0);controls.minDistance=Math.max(body.radius*2.2,0.7);controls.maxDistance=Math.max(focusDistance*6,18);

window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
function animate(){
  group.rotation.y+=.0003;
  bodyMesh.rotation.y+=body.rotationSpeed*(slug==="sun"?2.5:2.1);
  satelliteObjects.forEach(entry=>{
    entry.angle+=entry.satellite.orbitSpeed;
    entry.group.position.set(Math.cos(entry.angle)*entry.satellite.orbitRadius,Math.sin(entry.angle)*entry.satellite.orbitRadius*.08,Math.sin(entry.angle)*entry.satellite.orbitRadius);
    entry.mesh.rotation.y+=.003;
  });
  if(glow)glow.rotation.y-=0.0006;
  if(rings)rings.rotation.z+=0.0008;
  controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
