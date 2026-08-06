import * as THREE from "three";
import { CONSTELLATIONS, KNOWN_STAR_BY_SLUG } from "./data.js";
import { getGlowTexture } from "./star-renderer.js";

const app=document.getElementById("app"),listEl=document.getElementById("constellationList"),titleEl=document.getElementById("constellationTitle"),metaEl=document.getElementById("constellationMeta"),textEl=document.getElementById("constellationText"),factsEl=document.getElementById("starFacts"),starFile=document.getElementById("starFile"),detailEyebrow=document.getElementById("detailEyebrow"),zoomInSky=document.getElementById("zoomInSky"),zoomOutSky=document.getElementById("zoomOutSky"),resetSky=document.getElementById("resetSky");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x020617);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.01,1400);camera.position.set(0,0,0);camera.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xdbeafe,.9));

const sky=new THREE.Group();scene.add(sky);
const radius=90,raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();raycaster.params.Line.threshold=.7;
let active=null,clickables=[],dragging=false,dragMoved=false,lastX=0,lastY=0,targetFov=76,targetYaw=0,targetPitch=0,targetRoll=0;

const atlas=CONSTELLATIONS.map(constellation=>({...constellation,generated:Boolean(constellation.generated)}));

function celestialPosition(raHours,decDeg,r=radius){
  const ra=raHours/24*Math.PI*2,dec=THREE.MathUtils.degToRad(decDeg);
  return new THREE.Vector3(Math.cos(dec)*Math.sin(ra),Math.sin(dec),-Math.cos(dec)*Math.cos(ra)).multiplyScalar(r);
}
function basisFor(entry){
  const ra=entry.ra/24*Math.PI*2,center=celestialPosition(entry.ra,entry.dec,1).normalize();
  const east=new THREE.Vector3(Math.cos(ra),0,Math.sin(ra)).normalize();
  const north=new THREE.Vector3().crossVectors(center,east).normalize();
  return{center,east,north};
}
function localPoint(entry,point){
  const b=basisFor(entry),scale=.032;
  return b.center.clone().add(b.east.clone().multiplyScalar(point.x*scale)).add(b.north.clone().multiplyScalar(point.y*scale)).normalize().multiplyScalar(radius);
}
function generatedPattern(entry){
  const count=3+(entry.name.length%4),points=[];
  for(let i=0;i<count;i++)points.push({id:`${entry.slug}-${i}`,name:`${entry.name} ${i+1}`,x:(i-(count-1)/2)*1.35,y:Math.sin(i*1.9+entry.ra)*.92,size:.1+(i%2)*.04,color:0xe2e8f0,detail:`Estrella guía del dibujo de ${entry.name}.`});
  return{points,lines:points.slice(1).map((point,index)=>[points[index].id,point.id])};
}
function makeLabel(text,scale=.34,color="rgba(248,250,252,.82)"){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext("2d");ctx.fillStyle=color;ctx.font="800 34px Inter, sans-serif";ctx.fillText(text.toUpperCase(),18,76);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.scale.set(scale*9,scale*2.1,1);return sprite;
}
function addClickable(object,entry,point=null,starData=null,role="shape"){object.userData={clickable:true,entry,point,starData,role};clickables.push(object)}

function makeStars(){
  const count=8200,positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){const ra=Math.random()*24,dec=THREE.MathUtils.radToDeg(Math.asin(Math.random()*2-1)),p=celestialPosition(ra,dec,radius*.995);positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  sky.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xffffff,size:.12,transparent:true,opacity:.72,depthWrite:false})));
}
function makeMilkyWay(){
  const count=5200,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){const ra=i/count*24,dec=Math.sin(i*.035)*9+(Math.random()-.5)*10,p=celestialPosition(ra,dec,radius*.99);positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;colors[i*3]=.62;colors[i*3+1]=.78;colors[i*3+2]=1}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  sky.add(new THREE.Points(geometry,new THREE.PointsMaterial({size:.24,vertexColors:true,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false})));
}
function makeCircle(points,material){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);sky.add(line);return line}
function makeGuides(){
  const eqMat=new THREE.LineBasicMaterial({color:0x38bdf8,transparent:true,opacity:.9}),merMat=new THREE.LineBasicMaterial({color:0x22c55e,transparent:true,opacity:.88}),softN=new THREE.LineBasicMaterial({color:0x93c5fd,transparent:true,opacity:.2}),softS=new THREE.LineBasicMaterial({color:0xa78bfa,transparent:true,opacity:.2});
  const equator=[];for(let i=0;i<=480;i++)equator.push(celestialPosition(i/480*24,0,radius*1.002));makeCircle(equator,eqMat);
  [-45,45].forEach(dec=>{const pts=[];for(let i=0;i<=240;i++)pts.push(celestialPosition(i/240*24,dec,radius*1.001));makeCircle(pts,dec>0?softN:softS)});
  const meridian=[];for(let i=0;i<=240;i++){const a=i/240*Math.PI*2;meridian.push(new THREE.Vector3(0,Math.sin(a),-Math.cos(a)).multiplyScalar(radius*1.004))}makeCircle(meridian,merMat);
  [{text:"ECUADOR CELESTE",ra:0,dec:0,scale:.34,color:"rgba(125,211,252,.96)"},{text:"MERIDIANO N-S",ra:0,dec:12,scale:.28,color:"rgba(134,239,172,.94)"},{text:"CENIT 90°",ra:0,dec:84,scale:.3,color:"rgba(220,252,231,.96)"},{text:"NORTE",ra:1.5,dec:76,scale:.3,color:"rgba(191,219,254,.94)"},{text:"SUR",ra:13.5,dec:-76,scale:.3,color:"rgba(221,214,254,.94)"}].forEach(item=>{const label=makeLabel(item.text,item.scale,item.color);label.position.copy(celestialPosition(item.ra,item.dec,radius*.92));sky.add(label)});
}
function makeGrid(){
  for(let dec=-60;dec<=60;dec+=30){const pts=[];for(let i=0;i<=240;i++)pts.push(celestialPosition(i/240*24,dec,radius*.998));makeCircle(pts,new THREE.LineBasicMaterial({color:0x64748b,transparent:true,opacity:.12}))}
  for(let h=0;h<24;h+=2){const pts=[];for(let d=-88;d<=88;d+=2)pts.push(celestialPosition(h,d,radius*.997));makeCircle(pts,new THREE.LineBasicMaterial({color:0x64748b,transparent:true,opacity:.08}))}
}
function drawEntry(entry){
  const pattern=entry.points?{points:entry.points,lines:entry.lines||[]}:generatedPattern(entry),pointMap=new Map(pattern.points.map(point=>[point.id,point]));
  pattern.lines.forEach(([a,b])=>{const pa=pointMap.get(a),pb=pointMap.get(b);if(!pa||!pb)return;const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([localPoint(entry,pa),localPoint(entry,pb)]),new THREE.LineBasicMaterial({color:entry.generated?0x94a3b8:0x7dd3fc,transparent:true,opacity:entry.generated ? .14 : .42}));addClickable(line,entry,null,null,"line");sky.add(line)});
  pattern.points.forEach(point=>{
    const starData=point.starSlug?KNOWN_STAR_BY_SLUG[point.starSlug]:null,pos=localPoint(entry,point),size=(point.size||.18)*(entry.generated ? .48 : .76);
    const star=new THREE.Mesh(new THREE.SphereGeometry(size,16,16),new THREE.MeshBasicMaterial({color:point.color||starData?.color||0xffffff,transparent:true,opacity:.94,blending:THREE.AdditiveBlending}));
    star.position.copy(pos);addClickable(star,entry,point,starData,"star");sky.add(star);
    if(!entry.generated||point.size>.45){const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:point.color||starData?.color||0xffffff,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.copy(pos);glow.scale.set(size*5,size*5,1);addClickable(glow,entry,point,starData,"glow");sky.add(glow)}
  });
  const label=makeLabel(entry.name,entry.generated ? .12 : .22),center=celestialPosition(entry.ra,entry.dec,radius*.92);label.position.copy(center);addClickable(label,entry,null,null,"label");sky.add(label);
}

function renderButtons(){
  listEl.innerHTML="";
  const all=document.createElement("button");all.type="button";all.className="constellation-btn active";all.innerHTML="<strong>Mapa completo</strong><span>Esfera celeste 3D solidaria</span>";all.addEventListener("click",resetView);listEl.appendChild(all);
  CONSTELLATIONS.forEach(constellation=>{const button=document.createElement("button");button.type="button";button.className="constellation-btn";button.innerHTML=`<strong>${constellation.name}</strong><span>${constellation.hemisphere}</span>`;button.addEventListener("click",()=>focusEntry(atlas.find(item=>item.slug===constellation.slug)));listEl.appendChild(button)});
  const requestedSlug = new URLSearchParams(location.search).get("slug");
  const requested = requestedSlug && atlas.find(item => item.slug === requestedSlug);
  if (requested) focusEntry(requested);
}
function updateConstellationPanel(entry){
  active=entry;detailEyebrow.textContent=entry?"Constelación":"Atlas celeste";
  titleEl.textContent=entry?.name||"Esfera celeste 3D";metaEl.textContent=entry?`Hemisferio ${entry.hemisphere}`:"Cámara fija en [0,0,0], rotación 3 DoF";
  textEl.textContent=entry?.description||"Las constelaciones, el ecuador celeste y el meridiano N-S están dibujados en el mismo espacio 3D. Al rotar la cámara, todo se desplaza solidariamente; las guías no son HUD.";
  const count=atlas.length;
  factsEl.innerHTML=entry?`<div class="cell"><strong>Hemisferio</strong><span>${entry.hemisphere}</span></div><div class="cell"><strong>Estrellas trazadas</strong><span>${(entry.points||generatedPattern(entry).points).map(point=>point.name).join(", ")}</span></div>`:`<div class="cell"><strong>Constelaciones</strong><span>${count}</span></div><div class="cell"><strong>Perspectiva</strong><span>Centro de la esfera</span></div><div class="cell wide"><strong>Guías</strong><span>Azul: ecuador celeste. Verde: meridiano local N-S y cenit.</span></div>`;
  starFile.style.display="none";
}
function updateStarPanel(entry,point,starData){
  detailEyebrow.textContent=point?"Estrella":"Constelación";titleEl.textContent=point?.name||entry.name;metaEl.textContent=point?(starData?`${starData.type} · ${starData.constellation}`:entry.name):`Hemisferio ${entry.hemisphere}`;
  textEl.textContent=point?(starData?.description||point.detail||`Estrella del dibujo de ${entry.name}.`):(entry.description||`Constelación ${entry.name} en la esfera celeste.`);
  factsEl.innerHTML=point?`<div class="cell"><strong>Constelación</strong><span>${entry.name}</span></div><div class="cell"><strong>Rol</strong><span>${point.detail||"Punto del dibujo"}</span></div>${starData?`<div class="cell"><strong>Distancia</strong><span>${starData.distance}</span></div><div class="cell"><strong>Edad / luz</strong><span>${starData.age}</span></div>`:""}`:`<div class="cell"><strong>Hemisferio</strong><span>${entry.hemisphere}</span></div><div class="cell"><strong>Vista</strong><span>World space</span></div>`;
  if(starData){starFile.href=starData.file||`${starData.slug}.html`;starFile.textContent=`Abrir archivo de ${starData.name}`;starFile.style.display="inline-flex"}else{starFile.style.display="none"}
}
function shortestAngleDelta(from,to){let delta=(to-from+Math.PI)%(Math.PI*2)-Math.PI;return delta<-Math.PI?delta+Math.PI*2:delta}
function focusEntry(entry){if(!entry)return;updateConstellationPanel(entry);const ra=entry.ra/24*Math.PI*2,dec=THREE.MathUtils.degToRad(entry.dec);targetYaw+=shortestAngleDelta(targetYaw,-ra);targetPitch=dec;targetFov=Math.min(targetFov,46);history.replaceState(null,"",`?slug=${entry.slug}`)}
function setZoom(delta){targetFov=THREE.MathUtils.clamp(targetFov+delta,24,104)}
function resetView(){targetYaw=0;targetPitch=0;targetRoll=0;targetFov=76;updateConstellationPanel(null)}

window.addEventListener("pointerdown",event=>{if(event.target!==renderer.domElement)return;dragging=true;dragMoved=false;lastX=event.clientX;lastY=event.clientY});
window.addEventListener("pointermove",event=>{if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;dragMoved=dragMoved||Math.abs(dx)+Math.abs(dy)>4;if(event.shiftKey){targetRoll+=dx*.006}else{targetYaw-=dx*.004;targetPitch-=dy*.004}lastX=event.clientX;lastY=event.clientY});
window.addEventListener("pointerup",event=>{if(!dragging)return;dragging=false;if(dragMoved)return;pointer.x=event.clientX/innerWidth*2-1;pointer.y=-(event.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(clickables);if(hits.length){const {entry,point,starData}=hits[0].object.userData;updateStarPanel(entry,point,starData)}});
window.addEventListener("wheel",event=>{if(event.target!==renderer.domElement)return;event.preventDefault();setZoom(THREE.MathUtils.clamp(event.deltaY,-180,180)*.045)},{passive:false});
window.addEventListener("keydown",event=>{if(event.key.toLowerCase()==="q")targetRoll-=.08;if(event.key.toLowerCase()==="e")targetRoll+=.08});
zoomInSky.addEventListener("click",()=>setZoom(-10));zoomOutSky.addEventListener("click",()=>setZoom(10));resetSky.addEventListener("click",resetView);
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

function animate(ms){
  const time=ms*.001,zoomFocus=THREE.MathUtils.clamp((76-camera.fov)/42,0,1);
  camera.rotation.x=THREE.MathUtils.lerp(camera.rotation.x,targetPitch,.12);camera.rotation.y=THREE.MathUtils.lerp(camera.rotation.y,targetYaw,.12);camera.rotation.z=THREE.MathUtils.lerp(camera.rotation.z,targetRoll,.12);camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,.12);camera.updateProjectionMatrix();
  clickables.forEach((child,index)=>{
    if(!child.material)return;
    const {entry,role}=child.userData,isActive=active&&entry.slug===active.slug,isGenerated=entry.generated;
    let opacity=.16;
    if(role==="label")opacity=(isGenerated ? .04 : .2)+zoomFocus*(isGenerated ? .14 : .18);
    if(role==="line")opacity=isGenerated ? .08 : .3;
    if(role==="star")opacity=isGenerated ? .24 : .58;
    if(isActive){
      if(role==="label")opacity=.88;
      else if(role==="line")opacity=.82;
      else if(role==="star")opacity=.96;
      else opacity=.4;
    }
    if(child.isSprite&&child.userData.point)opacity+=Math.sin(time*2+index)*.035;
    child.material.opacity=THREE.MathUtils.clamp(opacity,0,.96);
  });
  renderer.render(scene,camera);requestAnimationFrame(animate);
}

makeStars();makeMilkyWay();makeGrid();makeGuides();atlas.forEach(drawEntry);updateConstellationPanel(null);renderButtons();requestAnimationFrame(animate);
