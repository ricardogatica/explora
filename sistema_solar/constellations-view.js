import * as THREE from "three";
import { CONSTELLATIONS, CONSTELLATION_BY_SLUG, KNOWN_STAR_BY_SLUG } from "./data.js";
import { getGlowTexture } from "./star-renderer.js";
import { baseLocal } from "./universe/sky.js";
// Esta vista cambia el ?slug= con replaceState sin recargar: hay que pedirle a
// nav.js que repinte la miga, o se queda con la constelación de llegada.
import { renderNav } from "./nav.js";

const app=document.getElementById("app"),listEl=document.getElementById("constellationList"),titleEl=document.getElementById("constellationTitle"),metaEl=document.getElementById("constellationMeta"),textEl=document.getElementById("constellationText"),factsEl=document.getElementById("starFacts"),starFile=document.getElementById("starFile"),detailEyebrow=document.getElementById("detailEyebrow"),zoomInSky=document.getElementById("zoomInSky"),zoomOutSky=document.getElementById("zoomOutSky"),resetSky=document.getElementById("resetSky"),starListEl=document.getElementById("starList"),starListTitle=document.getElementById("starListTitle");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x020617);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.01,1400);camera.position.set(0,0,0);camera.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xdbeafe,.9));

const sky=new THREE.Group();scene.add(sky);
const radius=90,raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();raycaster.params.Line.threshold=.7;
let active=null,clickables=[],dragging=false,dragMoved=false,lastX=0,lastY=0,targetFov=76,targetYaw=0,targetPitch=0,targetRoll=0;

/* Cuánto se encoge la figura proyectada al pegarla en la esfera celeste. La
   constante es del dibujo, no de los datos: points.x/y vienen en grados de cielo
   y aquí se decide cuánto ocupa un grado. fovParaEncuadrar() la usa también, así
   que el zoom no puede desajustarse de lo que se ve. */
const ESCALA_PROYECCION=.032;

function celestialPosition(raHours,decDeg,r=radius){
  const ra=raHours/24*Math.PI*2,dec=THREE.MathUtils.degToRad(decDeg);
  return new THREE.Vector3(Math.cos(dec)*Math.sin(ra),Math.sin(dec),-Math.cos(dec)*Math.cos(ra)).multiplyScalar(r);
}
/* La base la calcula universe/sky.js, que es donde se puede probar que el norte
   apunta al norte: aquí solo se traduce a vectores de Three.js. */
function basisFor(entry){
  const base=baseLocal(entry.ra,entry.dec);
  return{
    center:new THREE.Vector3(...base.center),
    east:new THREE.Vector3(...base.east),
    north:new THREE.Vector3(...base.north)
  };
}
function localPoint(entry,point){
  const b=basisFor(entry);
  return b.center.clone().add(b.east.clone().multiplyScalar(point.x*ESCALA_PROYECCION)).add(b.north.clone().multiplyScalar(point.y*ESCALA_PROYECCION)).normalize().multiplyScalar(radius);
}
/* Campo de visión que deja la figura encuadrada, ocupando algo más de la mitad
   del alto. Antes el zoom era fijo (fov 46 para todas): la Cruz del Sur, que
   abarca 7° de cielo, quedaba como un punto perdido, y la Hidra, que abarca 128°,
   no cabía. Ahora sale del tamaño real de cada figura.

   El límite inferior existe porque hay figuras diminutas: la del Microscopio son
   dos estrellas separadas 0,7°, y encuadrarlas de verdad dejaría un cielo vacío
   sin ninguna referencia alrededor. */
function fovParaEncuadrar(entry){
  const radioDibujado=Math.atan((entry.spanPlano||1)*ESCALA_PROYECCION)*180/Math.PI;
  return THREE.MathUtils.clamp(radioDibujado*2/.55,12,96);
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
  sky.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xffffff,size:.12,map:getGlowTexture(),transparent:true,opacity:.72,depthWrite:false})));
}
function makeMilkyWay(){
  const count=5200,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){const ra=i/count*24,dec=Math.sin(i*.035)*9+(Math.random()-.5)*10,p=celestialPosition(ra,dec,radius*.99);positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;colors[i*3]=.62;colors[i*3+1]=.78;colors[i*3+2]=1}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  sky.add(new THREE.Points(geometry,new THREE.PointsMaterial({size:.24,map:getGlowTexture(),vertexColors:true,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false})));
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
  const pointMap=new Map(entry.points.map(point=>[point.id,point]));
  entry.lines.forEach(([a,b])=>{const pa=pointMap.get(a),pb=pointMap.get(b);if(!pa||!pb)return;const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([localPoint(entry,pa),localPoint(entry,pb)]),new THREE.LineBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.42}));addClickable(line,entry,null,null,"line");sky.add(line)});
  entry.points.forEach(point=>{
    const starData=point.starSlug?KNOWN_STAR_BY_SLUG[point.starSlug]:null,pos=localPoint(entry,point),size=(point.size||.18)*.76;
    const star=new THREE.Mesh(new THREE.SphereGeometry(size,16,16),new THREE.MeshBasicMaterial({color:point.color||starData?.color||0xffffff,transparent:true,opacity:.94,blending:THREE.AdditiveBlending}));
    star.position.copy(pos);addClickable(star,entry,point,starData,"star");sky.add(star);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:getGlowTexture(),color:point.color||starData?.color||0xffffff,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.copy(pos);glow.scale.set(size*5,size*5,1);addClickable(glow,entry,point,starData,"glow");sky.add(glow);
  });
  const label=makeLabel(entry.name,.22),center=celestialPosition(entry.ra,entry.dec,radius*.92);label.position.copy(center);addClickable(label,entry,null,null,"label");sky.add(label);
}

// El resaltado de la lista lo mueve setActiveButton: antes estaba fijado a mano
// en «Mapa completo» y no se desplazaba nunca, ni al pulsar una constelación ni
// al llegar por deep-link (la página abre enfocada en Orión).
const buttonBySlug=new Map();let allButton=null;
function setActiveButton(slug){
  const target=slug?buttonBySlug.get(slug):allButton;
  if(allButton)allButton.classList.toggle("active",allButton===target);
  buttonBySlug.forEach(button=>button.classList.toggle("active",button===target));
}
function renderButtons(){
  listEl.innerHTML="";buttonBySlug.clear();
  const all=document.createElement("button");all.type="button";all.className="constellation-btn active";all.innerHTML="<strong>Mapa completo</strong><span>Esfera celeste 3D solidaria</span>";all.addEventListener("click",resetView);listEl.appendChild(all);allButton=all;
  CONSTELLATIONS.forEach(constellation=>{const button=document.createElement("button");button.type="button";button.className="constellation-btn";button.innerHTML=`<strong>${constellation.name}</strong><span>${constellation.hemisphere}</span>`;button.addEventListener("click",()=>focusEntry(constellation));listEl.appendChild(button);buttonBySlug.set(constellation.slug,button)});
  const requestedSlug = new URLSearchParams(location.search).get("slug");
  const requested = requestedSlug && CONSTELLATION_BY_SLUG[requestedSlug];
  if (requested) focusEntry(requested);
}
/* Celda de la tabla de datos. Se construye con textContent y no interpolando en
   innerHTML: los nombres salen del catálogo, pero el hábito importa —el slug de
   la URL ya llegó una vez hasta aquí. */
function celda(titulo,valor,ancha=false){
  const div=document.createElement("div");div.className=ancha?"cell wide":"cell";
  const strong=document.createElement("strong");strong.textContent=titulo;
  const span=document.createElement("span");span.textContent=valor;
  div.append(strong,span);return div;
}
function pintarTabla(celdas){factsEl.replaceChildren(...celdas)}

/* Las estrellas que componen la figura, de la más brillante a la más débil: es
   el orden en que se reconocen mirando al cielo. Cada fila abre la ficha de esa
   estrella en este mismo panel, sin perder la constelación de contexto. */
function pintarListaDeEstrellas(entry){
  starListEl.replaceChildren();
  if(!entry){starListTitle.hidden=true;return}
  starListTitle.hidden=false;
  starListTitle.textContent=`Estrellas de la figura (${entry.points.length})`;
  [...entry.points].sort((a,b)=>a.mag-b.mag).forEach(point=>{
    const fila=document.createElement("button");fila.type="button";fila.className="star-row";
    const nombre=document.createElement("strong");nombre.textContent=point.name;
    const dato=document.createElement("span");dato.textContent=`magnitud ${point.mag} · ${point.type}`;
    fila.append(nombre,dato);
    fila.addEventListener("click",()=>updateStarPanel(entry,point,point.starSlug?KNOWN_STAR_BY_SLUG[point.starSlug]:null));
    starListEl.appendChild(fila);
  });
}

function updateConstellationPanel(entry){
  active=entry;detailEyebrow.textContent=entry?"Constelación":"Atlas celeste";
  titleEl.textContent=entry?.name||"Esfera celeste 3D";
  metaEl.textContent=entry?`Hemisferio ${entry.hemisphere} · ${entry.latin} (${entry.abbr})`:"Cámara fija en [0,0,0], rotación 3 DoF";
  textEl.textContent=entry?.description||"Las constelaciones, el ecuador celeste y el meridiano N-S están dibujados en el mismo espacio 3D. Al rotar la cámara, todo se desplaza solidariamente; las guías no son HUD.";
  if(entry){
    const masBrillante=[...entry.points].sort((a,b)=>a.mag-b.mag)[0];
    pintarTabla([
      celda("Hemisferio",entry.hemisphere),
      celda("Estrellas de la figura",String(entry.points.length)),
      celda("Extensión en el cielo",`${entry.extensionGrados}°`),
      celda("Más brillante",`${masBrillante.name} (magnitud ${masBrillante.mag})`)
    ]);
  }else{
    pintarTabla([
      celda("Constelaciones",String(CONSTELLATIONS.length)),
      celda("Perspectiva","Centro de la esfera"),
      celda("Guías","Azul: ecuador celeste. Verde: meridiano local N-S y cenit.",true)
    ]);
  }
  pintarListaDeEstrellas(entry);
  starFile.style.display="none";
}
function updateStarPanel(entry,point,starData){
  if(!point){updateConstellationPanel(entry);return}
  /* Al pulsar una estrella de otra constelación, la lista y el resaltado se
     mudan con ella; al pulsar una fila de la lista que ya está puesta, no se
     repinta, o la lista saltaría al principio en cada elección. */
  if(active?.slug!==entry.slug){active=entry;pintarListaDeEstrellas(entry);setActiveButton(entry.slug)}
  detailEyebrow.textContent="Estrella";
  titleEl.textContent=point.name;
  metaEl.textContent=starData?`${starData.type} · ${starData.constellation}`:`${point.type} · ${entry.name}`;
  textEl.textContent=starData?.description||point.detail||`Estrella del dibujo de ${entry.name}.`;
  pintarTabla([
    celda("Constelación",entry.name),
    celda("Magnitud aparente",String(point.mag)),
    celda("Tipo",point.type),
    celda("Distancia",point.distance)
  ]);
  // La lista sigue puesta: se salta de una estrella a otra sin volver atrás.
  if(starData){starFile.href=starData.file||`${starData.slug}.html`;starFile.textContent=`Abrir archivo de ${starData.name}`;starFile.style.display="inline-flex"}else{starFile.style.display="none"}
}
function shortestAngleDelta(from,to){let delta=(to-from+Math.PI)%(Math.PI*2)-Math.PI;return delta<-Math.PI?delta+Math.PI*2:delta}
function focusEntry(entry){if(!entry)return;updateConstellationPanel(entry);const ra=entry.ra/24*Math.PI*2,dec=THREE.MathUtils.degToRad(entry.dec);targetYaw+=shortestAngleDelta(targetYaw,-ra);targetPitch=dec;
  /* El zoom se calcula, no se hereda. Antes era Math.min(targetFov,46), que solo
     sabía cerrarse: al pasar de la Hidra a la Cruz del Sur se quedaba con el
     encuadre de la anterior y nunca volvía a abrirse. */
  targetFov=fovParaEncuadrar(entry);
  history.replaceState(null,"",`?slug=${encodeURIComponent(entry.slug)}`);setActiveButton(entry.slug);renderNav()}
function setZoom(delta){targetFov=THREE.MathUtils.clamp(targetFov+delta,12,104)}
function resetView(){targetYaw=0;targetPitch=0;targetRoll=0;targetFov=76;updateConstellationPanel(null);const url=new URL(location.href);url.searchParams.delete("slug");history.replaceState(null,"",`${url.pathname}${url.search}${url.hash}`);setActiveButton(null);renderNav()}

window.addEventListener("pointerdown",event=>{if(event.target!==renderer.domElement)return;dragging=true;dragMoved=false;lastX=event.clientX;lastY=event.clientY});
window.addEventListener("pointermove",event=>{if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;dragMoved=dragMoved||Math.abs(dx)+Math.abs(dy)>4;if(event.shiftKey){targetRoll+=dx*.006}else{targetYaw-=dx*.004;targetPitch-=dy*.004}lastX=event.clientX;lastY=event.clientY});
window.addEventListener("pointerup",event=>{if(!dragging)return;dragging=false;if(dragMoved)return;pointer.x=event.clientX/innerWidth*2-1;pointer.y=-(event.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(clickables);if(!hits.length)return;const {entry,point,starData}=hits[0].object.userData;
  /* Pulsar una estrella abre su ficha; pulsar el trazo o el nombre de la
     constelación la enfoca, igual que su botón de la lista: es lo mismo que
     pedir «llévame a Orión», solo que señalándola en el cielo. */
  if(point)updateStarPanel(entry,point,starData);else focusEntry(entry);});
window.addEventListener("wheel",event=>{if(event.target!==renderer.domElement)return;event.preventDefault();setZoom(THREE.MathUtils.clamp(event.deltaY,-180,180)*.045)},{passive:false});
window.addEventListener("keydown",event=>{if(event.key.toLowerCase()==="q")targetRoll-=.08;if(event.key.toLowerCase()==="e")targetRoll+=.08});
zoomInSky.addEventListener("click",()=>setZoom(-10));zoomOutSky.addEventListener("click",()=>setZoom(10));resetSky.addEventListener("click",resetView);
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

function animate(ms){
  const time=ms*.001,zoomFocus=THREE.MathUtils.clamp((76-camera.fov)/42,0,1);
  camera.rotation.x=THREE.MathUtils.lerp(camera.rotation.x,targetPitch,.12);camera.rotation.y=THREE.MathUtils.lerp(camera.rotation.y,targetYaw,.12);camera.rotation.z=THREE.MathUtils.lerp(camera.rotation.z,targetRoll,.12);camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,.12);camera.updateProjectionMatrix();
  clickables.forEach((child,index)=>{
    if(!child.material)return;
    const {entry,role}=child.userData,isActive=active&&entry.slug===active.slug;
    let opacity=.16;
    if(role==="label")opacity=.2+zoomFocus*.18;
    if(role==="line")opacity=.3;
    if(role==="star")opacity=.58;
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

makeStars();makeMilkyWay();makeGrid();makeGuides();CONSTELLATIONS.forEach(drawEntry);updateConstellationPanel(null);renderButtons();requestAnimationFrame(animate);
