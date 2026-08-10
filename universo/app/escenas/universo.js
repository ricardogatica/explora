import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  BODY_DATA, BODY_ORDER, ROTATION_SLOWDOWN, CONSTELLATIONS, CONSTELLATION_BY_SLUG,
  KNOWN_GALAXIES, KNOWN_GALAXY_BY_SLUG, KNOWN_STARS, KNOWN_STAR_BY_SLUG,
  SOLAR_SYSTEM_BEHAVIOR, TIMELINE_EVENTS, TIMELINE_INDEX_BY_ID,
  getMoonOrbitPosition, getOrbitPosition
} from "../../cielo/data.js";
import { createBodyMaterials, createSaturnRings } from "../../render/body-renderer.js";
import { createMilkyWayObject } from "../../render/galaxy-renderer.js";
import {
  animateStellarObject, createQuasarObject, createStarObject, getGlowTexture
} from "../../render/star-renderer.js";
import { crearReloj, suavizado } from "@explora/compartido/tiempo.js";
import { liberarEscena } from "@explora/compartido/desmontar.js";
import { rutaDeTextura } from "../datos/texturas.js";
import { crearCuerposMenores } from "./cuerpos-menores.js";
import { baseGalactica } from "../../cielo/universe/sky.js";

/* La vista del universo: la escena grande, con su línea temporal.

   Es la de sistema_solar/main.js. Todo lo que construye la escena está copiado
   literalmente —el Big Bang, las primeras estrellas, la transición primordial,
   los efectos por etapa, los nueve cuerpos con sus órbitas, las 88
   constelaciones proyectadas y las estrellas conocidas— porque el objetivo no
   es rediseñarla.

   Lo que cambia es de quién depende. Antes escribía en el HTML de su página:
   pintaba la línea temporal, el mapa cósmico y la ficha del cuerpo. Ahora avisa
   por callback de en qué etapa está, qué zoom tiene y qué cuerpo se ha elegido,
   y de pintar se encarga React. La escena manda y la interfaz refleja, que es
   como funcionan las otras tres vistas.

   `alCambiar` se llama en cada cambio de estado con lo que la interfaz necesita
   saber. No lleva la escena dentro: solo datos. */

export function montarUniverso(contenedor, { alCambiar } = {}) {
  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  /* El zoom vivía en el valor de un <input range> del HTML y la escena lo leía
     en cada cuadro. Ahora es una variable de la escena y la interfaz lo refleja;
     al revés, cada cuadro tendría que consultar el DOM. */
  let zoomActual = SOLAR_SYSTEM_BEHAVIOR.initialZoom;

  /* Qué sigue la cámara y qué ficha está abierta son dos cosas distintas. La
     escena arranca mirando a la Tierra, pero la ficha aparece cuando alguien
     elige un cuerpo y no antes; moverse por la línea temporal cambia a quién
     sigue la cámara sin abrir nada. */
  let fichaAbierta = false;

  /* Un punto fijo al que mirar, que no es ningún cuerpo.

     Cada cuadro la mira se lleva hacia el cuerpo elegido, y sin cuerpo elegido
     `bodyPosition(null)` devuelve el origen: eso arrastraba la cámara de vuelta
     al Sol en cuanto se soltaba, así que encuadrar la galaxia no llegaba a durar
     un cuadro. Con un objetivo libre la mira se queda donde se la puso. */
  let objetivoLibre=null;

  const avisar = () => alCambiar?.({
    etapa: selectedEvent,
    progreso: timelineProgress,
    zoom: Math.round(zoomActual),
    abierta: fichaAbierta,
    /* Con la ficha abierta en una etapa cósmica no hay cuerpo que enseñar
       —todavía no existen— y la ficha pasa a contar la etapa. */
    elegido: fichaAbierta ? selectedBody : null,
    evento: TIMELINE_EVENTS[selectedEvent]
  });
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020617,0.000018);  // ver la nota de escalas de abajo
  const camera=new THREE.PerspectiveCamera(55,ancho()/alto(),0.01,9000);camera.position.set(0,6,42);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(ancho(),alto());renderer.outputColorSpace=THREE.SRGBColorSpace;contenedor.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=0.05;controls.minDistance=3;controls.maxDistance=26000;controls.autoRotate=true;controls.autoRotateSpeed=0.18;controls.target.set(0,0,0);
  scene.add(new THREE.AmbientLight(0x88aaff,0.55));const sunLight=new THREE.PointLight(0xffffff,4.2,0,2);sunLight.position.set(0,0,0);scene.add(sunLight);const fill=new THREE.DirectionalLight(0x7dd3fc,0.6);fill.position.set(-20,12,-12);scene.add(fill);
  function starField(count,radius,size,opacity){const g=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*3);for(let i=0;i<count;i++){const r=radius*(0.3+Math.random()*0.7),theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1);positions[i*3]=r*Math.sin(phi)*Math.cos(theta);positions[i*3+1]=r*Math.sin(phi)*Math.sin(theta);positions[i*3+2]=r*Math.cos(phi);const c=0.65+Math.random()*0.35;colors[i*3]=c;colors[i*3+1]=0.8+Math.random()*0.2;colors[i*3+2]=1}g.setAttribute("position",new THREE.BufferAttribute(positions,3));g.setAttribute("color",new THREE.BufferAttribute(colors,3));return new THREE.Points(g,new THREE.PointsMaterial({size,map:getGlowTexture(),vertexColors:true,transparent:true,opacity,depthWrite:false}))}
  /* ── Las tres escalas de la escena ──────────────────────────────────────

     Antes había una sola: las 746 estrellas conocidas colgaban del grupo de la
     galaxia y se repartían de 259 a 3606 unidades ALREDEDOR DEL CENTRO
     GALÁCTICO, mientras el sistema solar estaba en el origen, a 780 de ese
     centro y con Neptuno a 34. No es que las estrellas se vieran encima de los
     planetas: es que estaban mezcladas con ellos, y en el sitio equivocado.

     Ahora hay tres capas, cada una centrada donde le toca y con hueco vacío
     entre ellas, que es lo que deja leer la profundidad:

       sistema solar     0 – 35        hasta la órbita de Neptuno
       vecindario      620 – 2400      las 745 estrellas, de 4 a 2509 años luz
       Vía Láctea       disco ~10800   con el Sol puesto en el origen

     Las proporciones siguen sin ser las reales —la estrella más cercana está a
     4000 veces la órbita de Neptuno, no a 18— porque las de verdad no caben en
     ninguna pantalla; de eso se ocupan las vistas de escala, que existen justo
     para enseñar lo que aquí no cabe. Lo que sí es real es el ORDEN y la
     separación: cada capa se lee como una capa. */
  const backgroundStars=starField(10000,14000,4.2,0.72);scene.add(backgroundStars);

  const vecindario=new THREE.Group();scene.add(vecindario);

  /* ── El cielo fotográfico, y por qué se desvanece ───────────────────────

     Es el panorama de 8192×4096 de la Vía Láctea, el mismo que usa el mapa de
     constelaciones. Pintado por dentro de una esfera enorme da lo que ningún
     campo de puntos consigue: la banda de la galaxia tal como se ve.

     Pero una panorámica del cielo es una foto TOMADA DESDE AQUÍ, proyectada
     sobre una esfera centrada en nosotros. Vale mientras la cámara no se aleje
     del Sol. En cuanto se sale del vecindario deja de ser verdad: la galaxia no
     está pintada en una pared alrededor, está ahí delante, y es la que se
     dibuja con su disco de puntos.

     Así que la esfera se apaga con la distancia. Cerca del Sol, foto; lejos, la
     galaxia de verdad, vista desde fuera. Y el tramo intermedio, en el que una
     se apaga mientras la otra aparece, es justo lo que hay que entender: que
     esa banda del cielo y ese disco son la misma cosa vista desde dos sitios. */
  const CIELO={radio:4200,desdeAqui:1400,hastaAlli:3400};
  const cieloFoto=new THREE.Mesh(
    new THREE.SphereGeometry(CIELO.radio,64,48),
    new THREE.MeshBasicMaterial({side:THREE.BackSide,depthWrite:false,transparent:true,color:new THREE.Color(1.5,1.5,1.5)})
  );
  {
    /* La panorámica viene en proyección galáctica —la banda recta por el medio
       de la imagen— y se gira al marco ecuatorial, que es el de nuestras
       estrellas. Sin el giro caería sobre el ecuador celeste, y el plano
       galáctico llega a ±63° de declinación. */
    const base=baseGalactica();
    cieloFoto.applyMatrix4(new THREE.Matrix4().makeBasis(
      new THREE.Vector3(...base.x),new THREE.Vector3(...base.y),new THREE.Vector3(...base.z)
    ));
    new THREE.TextureLoader().load("/universo/cielo/via-lactea-8k.jpg",textura=>{
      textura.colorSpace=THREE.SRGBColorSpace;
      cieloFoto.material.map=textura;
      cieloFoto.material.needsUpdate=true;
    });
    cieloFoto.renderOrder=-2;   // detrás de todo, incluso del campo de estrellas
    scene.add(cieloFoto);
  }

  const galaxyParts=createMilkyWayObject(KNOWN_GALAXIES[0]),galaxy=galaxyParts.group;
  const viaLactea=new THREE.Group();viaLactea.add(galaxy);scene.add(viaLactea);
  const ESCALA_GALAXIA=10.5;
  viaLactea.scale.setScalar(ESCALA_GALAXIA);
  /* Los puntos de la galaxia se dibujan en píxeles, no en unidades de mundo.

     Con atenuación por distancia no hay tamaño que valga para esta escena: la
     cámara va de 6 a 26.000 unidades, así que un punto que se ve bien desde
     dentro del disco es invisible desde fuera —los brazos espirales
     desaparecían y quedaba el núcleo flotando en negro— y uno que se ve desde
     fuera tapa la pantalla desde dentro. Sin atenuación, la galaxia es siempre
     un campo de puntos de dos píxeles, que es como la dibuja un planetario. */
  /* El bulbo no se dibuja como un cuerpo. Era una esfera achatada con su halo,
     y por muy aditiva y cálida que fuera seguía siendo un huevo: una galaxia no
     tiene una superficie ahí en medio, tiene MÁS ESTRELLAS. El disco ya las
     concentra hacia el centro —los puntos se reparten con la raíz del radio—,
     así que quitando la esfera el centro se lee por densidad, que es lo que es.

     Se sacan del grafo y no se ocultan: `updateTemporalVisibility` recorre todos
     los hijos de la galaxia en cada cuadro y reescribe su `visible`, así que
     apagarlas duraba exactamente un cuadro y el huevo volvía. Se liberan a mano
     porque, fuera del grafo, el desmontaje ya no las encuentra. La textura del
     halo no se toca: está compartida con las demás estrellas. */
  [galaxyParts.core,galaxyParts.glow].forEach(parte=>{
    if(!parte)return;
    parte.removeFromParent();
    parte.geometry?.dispose?.();
    parte.material?.dispose?.();
  });

  const nubesDeLaGalaxia=[[galaxyParts.disk,1.9],[galaxyParts.dust,1.5],[galaxyParts.bar,2.1]]
    .filter(([parte])=>parte?.material)
    .map(([parte,tamano])=>{
      parte.material.sizeAttenuation=false;
      parte.material.size=tamano;
      parte.material.needsUpdate=true;
      // Se guarda la opacidad de partida: es el techo del desvanecido.
      return {parte,opacidadPlena:parte.material.opacity};
    });
  /* El Sol tiene que caer en el origen de la escena, que es donde está el
     sistema solar. Se calcula dónde queda su marcador dentro de la galaxia ya
     escalada y se desplaza el conjunto para llevarlo al cero: así, al alejarse,
     el vecindario aparece como una mota dentro de un brazo espiral, que es
     exactamente dónde estamos. */
  viaLactea.updateMatrixWorld(true);
  viaLactea.position.sub(galaxyParts.solarMarker.getWorldPosition(new THREE.Vector3()));

  /* El marcador «aquí estamos» de la galaxia queda, por definición, exactamente
     donde está el sistema solar. Escalado con el disco mide 84 unidades y su
     halo azul 735: desde dentro llenaban la pantalla de azul y tapaban la
     escena entera. Solo tiene sentido cuando se mira la galaxia desde fuera,
     así que aparece con la distancia. */
  const MARCADOR_DESDE=3000;
  const marcadorSolar=[galaxyParts.solarMarker,galaxyParts.markerGlow].filter(Boolean);

  const solar=new THREE.Group();scene.add(solar);
  const cosmicEvents=new THREE.Group();scene.add(cosmicEvents);
  function makePointSpriteTexture(){const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;const ctx=canvas.getContext("2d"),gradient=ctx.createRadialGradient(32,32,0,32,32,31);gradient.addColorStop(0,"rgba(255,255,255,1)");gradient.addColorStop(0.45,"rgba(210,235,255,.86)");gradient.addColorStop(1,"rgba(255,255,255,0)");ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture}
  const pointSpriteTexture=makePointSpriteTexture();
  function createCosmicEventVisuals(){const group=new THREE.Group(),bigBang=new THREE.Group(),firstStars=new THREE.Group(),earlyGalaxy=new THREE.Group();const shell=new THREE.Mesh(new THREE.SphereGeometry(9,64,64),new THREE.MeshBasicMaterial({color:0x7dd3fc,transparent:true,opacity:0.22,side:THREE.BackSide,blending:THREE.AdditiveBlending}));bigBang.add(shell);for(let i=0;i<4;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(5+i*3.4,5.15+i*3.4,96),new THREE.MeshBasicMaterial({color:i%2?0xa78bfa:0x38bdf8,transparent:true,opacity:0.28,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));ring.rotation.set(Math.PI/2,Math.random()*Math.PI,Math.random()*Math.PI);bigBang.add(ring)}const bangGeometry=new THREE.BufferGeometry(),bangCount=1600,bangPositions=new Float32Array(bangCount*3),bangColors=new Float32Array(bangCount*3);for(let i=0;i<bangCount;i++){const r=Math.pow(Math.random(),0.42)*30,theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1);bangPositions[i*3]=r*Math.sin(phi)*Math.cos(theta);bangPositions[i*3+1]=r*Math.sin(phi)*Math.sin(theta);bangPositions[i*3+2]=r*Math.cos(phi);bangColors[i*3]=0.6+Math.random()*0.4;bangColors[i*3+1]=0.75+Math.random()*0.25;bangColors[i*3+2]=1}bangGeometry.setAttribute("position",new THREE.BufferAttribute(bangPositions,3));bangGeometry.setAttribute("color",new THREE.BufferAttribute(bangColors,3));bigBang.add(new THREE.Points(bangGeometry,new THREE.PointsMaterial({size:1.8,map:pointSpriteTexture,vertexColors:true,transparent:true,opacity:0.86,blending:THREE.AdditiveBlending,depthWrite:false})));for(let n=0;n<6;n++){const nebula=new THREE.Mesh(new THREE.SphereGeometry(22+Math.random()*12,32,32),new THREE.MeshBasicMaterial({color:n%2?0x7c3aed:0x0ea5e9,transparent:true,opacity:0.08,blending:THREE.AdditiveBlending,depthWrite:false}));nebula.position.set((Math.random()-.5)*90,(Math.random()-.5)*35,(Math.random()-.5)*70);nebula.scale.set(1.8,0.45+Math.random()*0.6,1.1+Math.random());firstStars.add(nebula)}for(let n=0;n<18;n++){const star=new THREE.Mesh(new THREE.SphereGeometry(0.9+Math.random()*2.5,24,24),new THREE.MeshBasicMaterial({color:n%3===0?0xfff1b8:0xc7ddff,transparent:true,opacity:0.88,blending:THREE.AdditiveBlending}));star.position.set((Math.random()-.5)*120,(Math.random()-.5)*46,(Math.random()-.5)*80);firstStars.add(star);const glow=new THREE.Mesh(new THREE.SphereGeometry(3+Math.random()*5,24,24),new THREE.MeshBasicMaterial({color:0x93c5fd,transparent:true,opacity:0.12,blending:THREE.AdditiveBlending}));glow.position.copy(star.position);firstStars.add(glow)}const galaxyGeometry=new THREE.BufferGeometry(),galaxyCount=9000,galaxyPositions=new Float32Array(galaxyCount*3),galaxyColors=new Float32Array(galaxyCount*3);for(let i=0;i<galaxyCount;i++){const arm=i%3,radius=Math.pow(Math.random(),0.68)*90+5,angle=arm*Math.PI*2/3+radius*0.055+(Math.random()-.5)*0.9,thickness=7+radius*0.08;galaxyPositions[i*3]=Math.cos(angle)*radius+(Math.random()-.5)*thickness;galaxyPositions[i*3+1]=(Math.random()-.5)*(9+radius*0.04);galaxyPositions[i*3+2]=Math.sin(angle)*radius+(Math.random()-.5)*thickness;const core=Math.max(0,1-radius/95);galaxyColors[i*3]=0.45+core*0.55;galaxyColors[i*3+1]=0.58+core*0.32;galaxyColors[i*3+2]=0.9+core*0.1}galaxyGeometry.setAttribute("position",new THREE.BufferAttribute(galaxyPositions,3));galaxyGeometry.setAttribute("color",new THREE.BufferAttribute(galaxyColors,3));const formingDisk=new THREE.Points(galaxyGeometry,new THREE.PointsMaterial({size:1.75,map:pointSpriteTexture,vertexColors:true,transparent:true,opacity:0.72,blending:THREE.AdditiveBlending,depthWrite:false}));formingDisk.rotation.x=0.25;earlyGalaxy.add(formingDisk);const core=new THREE.Mesh(new THREE.SphereGeometry(7.5,36,36),new THREE.MeshBasicMaterial({color:0xe0f2fe,transparent:true,opacity:0.82,blending:THREE.AdditiveBlending}));earlyGalaxy.add(core);for(let n=0;n<5;n++){const cloud=new THREE.Mesh(new THREE.SphereGeometry(18+Math.random()*10,24,24),new THREE.MeshBasicMaterial({color:n%2?0x60a5fa:0xa78bfa,transparent:true,opacity:0.07,blending:THREE.AdditiveBlending,depthWrite:false}));cloud.position.set((Math.random()-.5)*130,(Math.random()-.5)*18,(Math.random()-.5)*90);cloud.scale.set(1.9,0.35,1.1);earlyGalaxy.add(cloud)}group.add(bigBang);group.add(firstStars);group.add(earlyGalaxy);return{group,bigBang,firstStars,earlyGalaxy}}
  const eventVisuals=createCosmicEventVisuals();cosmicEvents.add(eventVisuals.group);
  function makeGlowSphere(radius,color,opacity){return new THREE.Mesh(new THREE.SphereGeometry(radius,48,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}))}
  function makeDiskGroup(inner,outer,color,opacity,count=7){const group=new THREE.Group();for(let i=0;i<count;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(inner+i*(outer-inner)/count,inner+(i+1)*(outer-inner)/count,160),new THREE.MeshBasicMaterial({color,transparent:true,opacity:opacity*(1-i/count*.45),side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=Math.PI/2+(Math.random()-.5)*.12;ring.rotation.z=(Math.random()-.5)*.35;group.add(ring)}return group}
  function createPrimordialTransition(){const group=new THREE.Group(),stageStar=new THREE.Group(),stageSupernova=new THREE.Group(),stageQuasar=new THREE.Group();const stars=starField(2600,190,0.75,0.74);group.add(stars);for(let i=0;i<8;i++){const cloud=makeGlowSphere(28+Math.random()*25,i%2?0x2563eb:0x38bdf8,.045);cloud.position.set((Math.random()-.5)*150,(Math.random()-.5)*60,(Math.random()-.5)*90);cloud.scale.set(2.2,.55+Math.random()*.4,1.1+Math.random());group.add(cloud)}stageStar.add(makeGlowSphere(6,0xffffff,.95));stageStar.add(makeGlowSphere(14,0x93c5fd,.24));const starDisk=makeDiskGroup(6,20,0xffc77a,.16,9);starDisk.rotation.z=.35;stageStar.add(starDisk);const lens=new THREE.Mesh(new THREE.PlaneGeometry(130,1.1),new THREE.MeshBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false}));stageStar.add(lens);stageSupernova.add(makeGlowSphere(5,0xffffff,.9));stageSupernova.add(makeGlowSphere(24,0xfef3c7,.34));stageSupernova.add(makeGlowSphere(36,0xf472b6,.18));const shell=new THREE.Mesh(new THREE.SphereGeometry(28,64,64),new THREE.MeshBasicMaterial({color:0xfff6b0,transparent:true,opacity:.32,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));stageSupernova.add(shell);for(let i=0;i<28;i++){const spike=new THREE.Mesh(new THREE.PlaneGeometry(.45,20+Math.random()*18),new THREE.MeshBasicMaterial({color:i%2?0xff5fa2:0xffef9f,transparent:true,opacity:.12,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));spike.position.set(0,0,0);spike.rotation.z=i/28*Math.PI*2;stageSupernova.add(spike)}stageQuasar.position.set(-32,-10,0);const quasarDisk=makeDiskGroup(9,47,0xff9f45,.28,12);quasarDisk.rotation.x=Math.PI/2.35;quasarDisk.rotation.z=-.26;stageQuasar.add(quasarDisk);stageQuasar.add(makeGlowSphere(10,0xffffff,.85));stageQuasar.add(makeGlowSphere(22,0xffe0a3,.22));const jet=new THREE.Mesh(new THREE.PlaneGeometry(120,5),new THREE.MeshBasicMaterial({color:0xdbeafe,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false}));jet.rotation.z=.55;stageQuasar.add(jet);group.add(stageStar);group.add(stageSupernova);group.add(stageQuasar);cosmicEvents.add(group);return{group,stars,stageStar,stageSupernova,stageQuasar}}
  const primordialTransition=createPrimordialTransition();
  function orbitInclination(index=0){return[-0.18,-0.12,-0.06,0.02,0.08,0.14,0.2,0.26,0.32][index]??0}
  function orbitPoint(radius,angle,index=0){const inclination=orbitInclination(index);return new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*inclination+index*0.08,Math.sin(angle)*radius)}
  function makeOrbit(radius,color=0x334155,index=0){const pts=[];for(let i=0;i<240;i++){const a=i/240*Math.PI*2;pts.push(orbitPoint(radius,a,index))}return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:0.3}))}
  const materials=createBodyMaterials(BODY_DATA);
  const planetObjects={},orbitObjects={},universeObjects={};let earthMesh,moonMesh,moonOrbit,saturnRings,earthClouds,atmosphere,selectedBody="earth",preferredFocus="earth",selectedEvent=TIMELINE_EVENTS.length-1,timelineProgress=TIMELINE_EVENTS.length-1,targetDistance=18,currentOrbitScale=1,zoomVelocity=0;
  function makeLabel(name,{color="rgba(248,250,252,.98)",scale=[3.4,.85,1],font="700 46px Inter, sans-serif"}={}){const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d");ctx.fillStyle=color;ctx.font=font;ctx.fillText(name,22,74);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));spr.scale.set(...scale);return spr}
  function createPlanet(slug,material){const body=BODY_DATA[slug],group=new THREE.Group();group.userData.slug=slug;const mesh=new THREE.Mesh(new THREE.SphereGeometry(body.radius,64,64),material);mesh.userData.slug=slug;mesh.userData.clickable=true;group.add(mesh);if(slug!=="sun"){const label=makeLabel(body.name);label.position.set(0,body.radius+.7,0);group.add(label)}const orbit=makeOrbit(body.orbitRadius,slug==="earth"?0x3b82f6:0x334155,BODY_ORDER.indexOf(slug));orbitObjects[slug]=orbit;solar.add(orbit);solar.add(group);planetObjects[slug]=group;return{group,mesh,orbit}}
  const sunBody=createPlanet("sun",materials.sun);sunBody.group.position.set(0,0,0);sunBody.group.add(new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.sun.radius*1.16,48,48),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:0.25})));
  createPlanet("mercury",materials.mercury);createPlanet("venus",materials.venus);const earthObj=createPlanet("earth",materials.earthModern);earthMesh=earthObj.mesh;
  earthClouds=new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*1.02,48,48),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.18,emissive:0xffffff,emissiveIntensity:0.03}));earthObj.group.add(earthClouds);
  atmosphere=new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*1.09,48,48),new THREE.MeshBasicMaterial({color:0x4fc3ff,transparent:true,opacity:0.12,side:THREE.BackSide}));earthObj.group.add(atmosphere);
  const moonGroup=new THREE.Group();moonGroup.userData.slug="moon";moonMesh=new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.moon.radius,36,36),materials.moon);moonMesh.userData.slug="moon";moonMesh.userData.clickable=true;moonGroup.add(moonMesh);const moonLabel=makeLabel("Luna");moonLabel.position.set(0,BODY_DATA.moon.radius+.45,0);moonGroup.add(moonLabel);earthObj.group.add(moonGroup);planetObjects.moon=moonGroup;
  const moonOrbitPts=[];for(let i=0;i<120;i++){const a=i/120*Math.PI*2;moonOrbitPts.push(new THREE.Vector3(Math.cos(a)*BODY_DATA.moon.orbitRadius,Math.sin(a)*BODY_DATA.moon.orbitRadius*0.22,Math.sin(a)*BODY_DATA.moon.orbitRadius))}moonOrbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(moonOrbitPts),new THREE.LineBasicMaterial({color:0x94a3b8,transparent:true,opacity:0.3}));earthObj.group.add(moonOrbit);
  const stageEffects={};
  function makeParticleCloud(count,radius,colorA,colorB,size=0.08){const geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*3),a=new THREE.Color(colorA),b=new THREE.Color(colorB);for(let i=0;i<count;i++){const r=radius*(0.35+Math.random()*0.65),angle=Math.random()*Math.PI*2,height=(Math.random()-.5)*radius*.16;positions[i*3]=Math.cos(angle)*r;positions[i*3+1]=height;positions[i*3+2]=Math.sin(angle)*r;const c=a.clone().lerp(b,Math.random());colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b}geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));return new THREE.Points(geometry,new THREE.PointsMaterial({size,map:pointSpriteTexture,vertexColors:true,transparent:true,opacity:.86,blending:THREE.AdditiveBlending,depthWrite:false}))}
  function makeSurfaceSprites(count,radius,color,size=0.045){const geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*3);for(let i=0;i<count;i++){const theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1),r=radius*(1.02+Math.random()*.04);positions[i*3]=Math.sin(phi)*Math.cos(theta)*r;positions[i*3+1]=Math.sin(phi)*Math.sin(theta)*r;positions[i*3+2]=Math.cos(phi)*r}geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));return new THREE.Points(geometry,new THREE.PointsMaterial({size,map:pointSpriteTexture,color,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false}))}
  function createStageEffects(){const proto=new THREE.Group();const shock=new THREE.Mesh(new THREE.SphereGeometry(16,64,64),new THREE.MeshBasicMaterial({color:0x93c5fd,transparent:true,opacity:.08,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));proto.add(shock);const protoSun=new THREE.Mesh(new THREE.SphereGeometry(1.65,48,48),new THREE.MeshBasicMaterial({color:0xfff1a8,transparent:true,opacity:.88,blending:THREE.AdditiveBlending}));proto.add(protoSun);const coreGlow=new THREE.Mesh(new THREE.SphereGeometry(3.2,48,48),new THREE.MeshBasicMaterial({color:0xff8a2a,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));proto.add(coreGlow);for(let i=0;i<8;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(2.6+i*1.75,2.82+i*1.75,192),new THREE.MeshBasicMaterial({color:i%2?0xffb86b:0x93c5fd,transparent:true,opacity:.2-i*.012,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=Math.PI/2+(i-3.5)*.01;ring.rotation.z=i*.16;ring.userData.spin=.002+i*.00035;proto.add(ring)}const dust=makeParticleCloud(3200,17,0xfff0a8,0xff7a18,.075);dust.userData.kind="dust";proto.add(dust);for(let i=0;i<48;i++){const angle=i/48*Math.PI*2+Math.random()*.18,radius=4.4+Math.random()*10.6,size=.018+Math.random()*.035;const clump=new THREE.Mesh(new THREE.TetrahedronGeometry(size,0),new THREE.MeshBasicMaterial({color:i%3?0xffd08a:0xcbd5e1,transparent:true,opacity:.52,blending:THREE.AdditiveBlending}));clump.position.set(Math.cos(angle)*radius,(Math.random()-.5)*.18,Math.sin(angle)*radius);clump.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);clump.userData.orbitRadius=radius;clump.userData.orbitAngle=angle;clump.userData.orbitSpeed=.0025+Math.random()*.002;proto.add(clump)}proto.userData={shock,protoSun,coreGlow};solar.add(proto);stageEffects.proto=proto;
  const earthDust=new THREE.Group();earthDust.add(makeParticleCloud(900,1.9,0xffb86b,0xff3d00,.035));const moltenGlow=new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*1.32,48,48),new THREE.MeshBasicMaterial({color:0xff4500,transparent:true,opacity:.2,blending:THREE.AdditiveBlending}));earthDust.add(moltenGlow);earthObj.group.add(earthDust);stageEffects.earthDust=earthDust;
  const moonDebris=new THREE.Group();const debrisRing=new THREE.Mesh(new THREE.RingGeometry(0.65,1.55,128),new THREE.MeshBasicMaterial({color:0xffb36b,transparent:true,opacity:.34,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));debrisRing.rotation.x=Math.PI/2.7;moonDebris.add(debrisRing);moonDebris.add(makeParticleCloud(700,1.45,0xffddb0,0xb8b8b8,.035));const impactGlow=new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*.72,32,32),new THREE.MeshBasicMaterial({color:0xff5a1f,transparent:true,opacity:.22,blending:THREE.AdditiveBlending}));impactGlow.position.set(BODY_DATA.earth.radius*.62,.05,BODY_DATA.earth.radius*.35);moonDebris.add(impactGlow);earthObj.group.add(moonDebris);stageEffects.moonDebris=moonDebris;
  const oceans=new THREE.Group();const water=new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*1.045,64,64),new THREE.MeshBasicMaterial({color:0x1d9bf0,transparent:true,opacity:.28,blending:THREE.AdditiveBlending}));oceans.add(water);for(let i=0;i<5;i++){const band=new THREE.Mesh(new THREE.RingGeometry(BODY_DATA.earth.radius*(1.08+i*.02),BODY_DATA.earth.radius*(1.09+i*.02),96),new THREE.MeshBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.16,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));band.rotation.set(Math.PI/2.1,Math.random()*Math.PI,Math.random()*Math.PI);oceans.add(band)}earthObj.group.add(oceans);stageEffects.oceans=oceans;
  const oxidation=new THREE.Group();oxidation.add(new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*1.18,64,64),new THREE.MeshBasicMaterial({color:0x8ddcff,transparent:true,opacity:.2,side:THREE.BackSide,blending:THREE.AdditiveBlending})));oxidation.add(makeSurfaceSprites(420,BODY_DATA.earth.radius,0x7dd3fc,.035));earthObj.group.add(oxidation);stageEffects.oxidation=oxidation;
  const life=new THREE.Group();life.add(makeSurfaceSprites(520,BODY_DATA.earth.radius,0x7cff8a,.04));life.add(new THREE.Mesh(new THREE.SphereGeometry(BODY_DATA.earth.radius*1.12,64,64),new THREE.MeshBasicMaterial({color:0x22c55e,transparent:true,opacity:.08,side:THREE.BackSide,blending:THREE.AdditiveBlending})));earthObj.group.add(life);stageEffects.life=life}
  createStageEffects();
  createPlanet("mars",materials.mars);createPlanet("jupiter",materials.jupiter);const saturnObj=createPlanet("saturn",materials.saturn);// El anillo lo construye body-renderer, con su textura real y las UV radiales.
  saturnRings=createSaturnRings(BODY_DATA.saturn.radius,{texture:rutaDeTextura(BODY_DATA.saturn.textures?.ring)});saturnObj.group.add(saturnRings);createPlanet("uranus",materials.uranus);createPlanet("neptune",materials.neptune);
  /* De años luz a unidades de escena, dentro del cascarón del vecindario.

     Logarítmico porque el catálogo abarca de 4 a 2509 años luz: lineal dejaría
     el 95% de las estrellas amontonado contra el borde exterior. El cuásar no
     entra en esta cuenta —está a 10.400 millones de años luz, no es del
     vecindario— y se coloca más allá de la galaxia, que es donde está. */
  const VECINDARIO={cerca:620,lejos:2400,masLejana:2509};
  const DISTANCIA_DEL_CUASAR=26000;

  function posicionEstelar(star){
    const direccion=new THREE.Vector3(...star.direction);
    if(star.kind==="quasar")return direccion.multiplyScalar(DISTANCIA_DEL_CUASAR);
    const ly=Number.isFinite(star.distanceLy)?star.distanceLy:200;
    const t=Math.log10(ly+1)/Math.log10(VECINDARIO.masLejana+1);
    return direccion.multiplyScalar(THREE.MathUtils.lerp(VECINDARIO.cerca,VECINDARIO.lejos,Math.min(t,1)));
  }
  const POSICION_ESTELAR=new Map(KNOWN_STARS.map(star=>[star.slug,posicionEstelar(star)]));
  const dondeEsta=star=>POSICION_ESTELAR.get(star.slug)??new THREE.Vector3(...star.position);

  /* El cinturón, entre Marte y Júpiter y sin tocar a ninguno de los dos. Los
     bordes salen de sus órbitas, así que si mañana se ajusta una órbita el
     cinturón se ajusta con ella. */
  const cuerposMenores=crearCuerposMenores({
    interior:BODY_DATA.mars.orbitRadius*1.12,
    exterior:BODY_DATA.jupiter.orbitRadius*0.88,
    hacerEtiqueta:texto=>makeLabel(texto,{color:"rgba(203,213,225,.85)",scale:[7,1.75,1],font:"700 40px Inter, sans-serif"})
  });
  solar.add(cuerposMenores.grupo);

  function createKnownUniverse(){
    KNOWN_GALAXIES.forEach(item=>{
      const label=makeLabel(item.name,{color:"rgba(219,234,254,.96)",scale:[22,5.5,1],font:"900 46px Inter, sans-serif"});
      /* En la galaxia escalada, esta etiqueta iría a parar a decenas de miles
         de unidades del Sol. Se pone en la capa del vecindario, mirando hacia
         el centro galáctico, que es lo que nombra. */
      label.position.set(0,-260,-2600);label.scale.multiplyScalar(9);label.userData.slug=item.slug;label.userData.kind="galaxy";label.userData.clickable=true;label.userData.visibleFrom=item.visibleFrom;
      vecindario.add(label);universeObjects[item.slug]={object:viaLactea,label,focusObject:galaxyParts.solarMarker,kind:"galaxy",visibleFrom:item.visibleFrom,focusDistance:420};
    });
    KNOWN_STARS.forEach(star=>{
      const isQuasar=star.kind==="quasar",stellar=isQuasar?createQuasarObject(star):createStarObject(star),mesh=stellar.group;
      // El objeto viene colocado con la posición vieja: se recoloca en su capa.
      mesh.position.copy(dondeEsta(star));
      const labelScale=isQuasar?[22,5.5,1]:[16,4,1],label=makeLabel(star.name,{color:isQuasar?"rgba(255,225,180,.98)":"rgba(226,232,240,.98)",scale:labelScale,font:"800 46px Inter, sans-serif"});
      const donde=dondeEsta(star);
      label.position.set(donde.x+(isQuasar?42:24),donde.y+(isQuasar?28:18),donde.z);label.userData.slug=star.slug;label.userData.kind=star.kind||"star";label.userData.clickable=true;
      vecindario.add(mesh);vecindario.add(label);universeObjects[star.slug]={...stellar,object:mesh,label,kind:star.kind||"star",visibleFrom:star.visibleFrom,focusDistance:isQuasar?260:120};
    });
    CONSTELLATIONS.forEach(constellation=>{
      const stars=constellation.stars.map(slug=>KNOWN_STAR_BY_SLUG[slug]).filter(Boolean),parts=[];
      if(stars.length>1){const points=stars.map(dondeEsta);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x93c5fd,transparent:true,opacity:0.38}));vecindario.add(line);parts.push(line)}
      const anchor=stars[0];
      if(anchor){const label=makeLabel(constellation.name,{color:"rgba(167,139,250,.9)",scale:[12,3,1],font:"800 42px Inter, sans-serif"});const donde=dondeEsta(anchor);label.position.set(donde.x,donde.y+42,donde.z);label.userData.slug=constellation.slug;label.userData.kind="constellation";label.userData.clickable=true;vecindario.add(label);parts.push(label);universeObjects[constellation.slug]={object:label,parts,kind:"constellation",visibleFrom:constellation.visibleFrom}}
    })
  }
  createKnownUniverse();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function eventIndex(id){return TIMELINE_INDEX_BY_ID[id]??0}
  function currentEvent(){return TIMELINE_EVENTS[selectedEvent]}
  function timelineBlend(){return 0.25+0.75*(1-Math.min(1,Math.abs(timelineProgress-selectedEvent)*1.6))}
  function setMaterialOpacity(object,strength){object.traverse(child=>{const materials=child.material?Array.isArray(child.material)?child.material:[child.material]:[];materials.forEach(material=>{if(material.userData.baseOpacity==null)material.userData.baseOpacity=material.opacity;material.opacity=material.userData.baseOpacity*strength;if(material.opacity<1)material.transparent=true})})}
  function setEffectActive(object,active){const strength=active?timelineBlend():0;object.visible=strength>0.02;if(object.visible)setMaterialOpacity(object,strength)}
  function setEffectStrength(object,strength){object.visible=strength>0.02;if(object.visible)setMaterialOpacity(object,strength)}
  function smoothRange(value,start,end){const t=THREE.MathUtils.clamp((value-start)/(end-start),0,1);return t*t*(3-2*t)}
  function pulseRange(value,start,peak,end){return Math.min(smoothRange(value,start,peak),1-smoothRange(value,peak,end))}
  function updatePrimordialTransition(progress){const visible=progress>0.02&&progress<1;primordialTransition.group.visible=visible;if(!visible)return;const starStrength=pulseRange(progress,.04,.28,.58),supernovaStrength=pulseRange(progress,.36,.58,.82),quasarStrength=smoothRange(progress,.68,.98),backdropStrength=smoothRange(progress,.04,.32);setEffectStrength(primordialTransition.stars,.2+.65*backdropStrength);setEffectStrength(primordialTransition.stageStar,starStrength);setEffectStrength(primordialTransition.stageSupernova,supernovaStrength);setEffectStrength(primordialTransition.stageQuasar,quasarStrength);primordialTransition.stageSupernova.scale.setScalar(.5+progress*1.35);primordialTransition.stageQuasar.scale.setScalar(.72+quasarStrength*.55)}
  function existsAt(slug,event=currentEvent()){const body=BODY_DATA[slug];if(!body?.visibleFrom)return true;return eventIndex(event.id)>=eventIndex(body.visibleFrom)}
  function universeExistsAt(item,event=currentEvent()){if(!item?.visibleFrom)return true;return eventIndex(event.id)>=eventIndex(item.visibleFrom)}
  function getBodyStage(body,event=currentEvent()){const stages=body.timelineStages||[];let active=stages[0];stages.forEach(stage=>{if(eventIndex(event.id)>=eventIndex(stage.from))active=stage});return active}
  function firstVisibleBody(){return BODY_ORDER.find(slug=>existsAt(slug))||null}
  function isEarlyUniverseEvent(event=currentEvent()){return eventIndex(event.id)<=eventIndex("first-stars")}
  function isCosmicEventFocus(event=currentEvent()){return isEarlyUniverseEvent(event)||event.id==="early-galaxies"||event.id==="early-milky-way"}
  function isSolarFormationEvent(event=currentEvent()){return event.id==="solar-system-formation"}
  function focusSlugForEvent(event=currentEvent()){const map={["solar-system-formation"]:"sun",["earth-formation"]:"earth",["moon-formation"]:"moon",["early-oceans"]:"earth",["great-oxidation"]:"earth",["complex-life"]:"earth",["pangaea"]:"earth",["pangaea-breakup"]:"earth",["advanced-breakup"]:"earth",["modern-continents"]:"earth",["today"]:"earth"};return map[event.id]||firstVisibleBody()}
  function fallbackFocusForPreferred(slug,event=currentEvent()){if(!slug)return null;if(BODY_DATA[slug]){if(existsAt(slug,event)&&(!isSolarFormationEvent(event)||slug==="sun"))return slug;if(eventIndex(event.id)>=eventIndex("solar-system-formation"))return "sun";return null}if(universeObjects[slug]&&universeExistsAt(universeObjects[slug],event))return slug;return null}
  function resolvePreferredFocus(){const resolved=fallbackFocusForPreferred(preferredFocus);if(resolved){focusOn(resolved,null,{remember:false})}else{focusTimelineEvent(null,{remember:false})}}
  function isActuallyVisible(object){let current=object;while(current){if(!current.visible)return false;current=current.parent}return true}
  function updateTemporalVisibility(){const event=currentEvent(),firstStarsIndex=eventIndex("first-stars"),birthProgress=THREE.MathUtils.clamp(timelineProgress/firstStarsIndex,0,1),birthTransition=timelineProgress<firstStarsIndex,solarFormation=isSolarFormationEvent(event);const bg=new THREE.Color(0xffffff).lerp(new THREE.Color(0x020617),smoothRange(birthProgress,.04,.72));renderer.setClearColor(bg,1);scene.fog.color.copy(bg);backgroundStars.visible=!birthTransition&&eventIndex(event.id)>=firstStarsIndex;setEffectStrength(eventVisuals.bigBang,0);updatePrimordialTransition(birthProgress);setEffectActive(eventVisuals.firstStars,!birthTransition&&event.id==="first-stars");setEffectActive(eventVisuals.earlyGalaxy,event.id==="early-galaxies"||event.id==="early-milky-way");cosmicEvents.visible=primordialTransition.group.visible||eventVisuals.firstStars.visible||eventVisuals.earlyGalaxy.visible;setEffectActive(stageEffects.proto,solarFormation);setEffectActive(stageEffects.earthDust,event.id==="earth-formation");setEffectActive(stageEffects.moonDebris,event.id==="moon-formation");setEffectActive(stageEffects.oceans,event.id==="early-oceans");setEffectActive(stageEffects.oxidation,event.id==="great-oxidation");setEffectActive(stageEffects.life,event.id==="complex-life");earthClouds.visible=eventIndex(event.id)>=eventIndex("great-oxidation");atmosphere.visible=eventIndex(event.id)>=eventIndex("great-oxidation");BODY_ORDER.forEach(slug=>{const visible=!birthTransition&&existsAt(slug,event)&&(!solarFormation||slug==="sun"),group=planetObjects[slug],orbit=orbitObjects[slug];if(group)group.visible=visible;if(orbit)orbit.visible=visible&&slug!=="sun"&&!solarFormation});planetObjects.moon.visible=!birthTransition&&!solarFormation&&existsAt("moon",event);if(moonOrbit)moonOrbit.visible=!birthTransition&&!solarFormation&&existsAt("moon",event);const showGalaxy=!birthTransition&&eventIndex(event.id)>=firstStarsIndex&&!isCosmicEventFocus(event);/* La galaxia ya no se esconde según el zoom. Antes había que esconderla
     porque estaba encima del sistema solar; ahora su disco empieza a miles de
     unidades y de lejos o de cerca se ve lo que corresponde. */
    viaLactea.visible=showGalaxy;vecindario.visible=showGalaxy;
    galaxy.children.forEach(child=>{const visibleFrom=child.userData.visibleFrom;child.visible=showGalaxy&&(!visibleFrom||eventIndex(event.id)>=eventIndex(visibleFrom))});Object.entries(universeObjects).forEach(([slug,entry])=>{const visible=showGalaxy&&universeExistsAt(entry,event);entry.object.visible=visible;if(entry.label)entry.label.visible=visible;if(entry.parts)entry.parts.forEach(part=>{part.visible=visible})})}
  function targetOrbitScale(){const zoom=zoomActual/100,zoomScale=1+(1-zoom)*(SOLAR_SYSTEM_BEHAVIOR.zoomOrbitScale-1),focusScale=BODY_DATA[selectedBody]?SOLAR_SYSTEM_BEHAVIOR.focusedOrbitScale:1;return Math.max(zoomScale,focusScale)}
  function syncOrbitScale(avance){currentOrbitScale=THREE.MathUtils.lerp(currentOrbitScale,targetOrbitScale(),suavizado(SOLAR_SYSTEM_BEHAVIOR.orbitScaleLerp,avance));Object.values(orbitObjects).forEach(orbit=>orbit.scale.setScalar(currentOrbitScale))}
  function getEarthMaterialByStage(stage){switch(stage){case"molten":return materials.earthMolten;case"archaean":return materials.earthArchaean;case"proterozoic":return materials.earthProterozoic;case"paleozoic":return materials.earthPaleozoic;case"pangaea":return materials.earthPangaea;case"breakup1":return materials.earthBreakup1;case"breakup2":return materials.earthBreakup2;default:return materials.earthModern}}
  function selectTimelineProgress(value,{focusMode="preserve",zoom=true}={}){timelineProgress=THREE.MathUtils.clamp(Number(value),0,TIMELINE_EVENTS.length-1);selectedEvent=Math.round(timelineProgress);const ev=currentEvent();earthMesh.material=getEarthMaterialByStage(ev.earthStage);if(zoom)setZoom(ev.zoom);updateTemporalVisibility();if(focusMode==="event"){const eventFocus=focusSlugForEvent(ev);if(isCosmicEventFocus(ev)){preferredFocus=null;focusTimelineEvent()}else{preferredFocus=eventFocus;focusOn(eventFocus)}}else{resolvePreferredFocus()}avisar()}
  function bodyPosition(slug){if(!slug)return new THREE.Vector3();if(slug==="moon"){return planetObjects.earth.position.clone().add(planetObjects.moon.position)}if(planetObjects[slug])return planetObjects[slug].position.clone();if(universeObjects[slug])return (universeObjects[slug].focusObject||universeObjects[slug].object).getWorldPosition(new THREE.Vector3());return new THREE.Vector3()}
  /* Logarítmico y no lineal. La barra recorre de 6 a 26.000 unidades: con una
   interpolación lineal, o su curva, el sistema solar entero cabía en el primer
   tramo y el resto era vacío. Cada paso de la barra multiplica la distancia por
   lo mismo, que es como se mira el cielo: por órdenes de magnitud. */
  function setZoom(value){
    zoomActual=value;
    const {min,max}=SOLAR_SYSTEM_BEHAVIOR.zoomDistance;
    targetDistance=min*Math.pow(max/min,THREE.MathUtils.clamp(value,0,100)/100);
  }
  function focusTimelineEvent(distance=null,{remember=true}={}){objetivoLibre=null;if(remember)preferredFocus=null;selectedBody=null;controls.target.set(0,0,0);const eventDistance={["big-bang"]:58,inflation:74,["cosmic-background"]:92,["dark-ages"]:118,["first-stars"]:135,["early-galaxies"]:150,["early-milky-way"]:155};targetDistance=distance??eventDistance[currentEvent().id]??120;avisar()}
  function focusOn(slug,distance=null,{remember=true}={}){objetivoLibre=null;if(!slug){focusTimelineEvent(distance,{remember});return}if(remember)preferredFocus=slug;const resolved=fallbackFocusForPreferred(slug);if(!resolved){focusTimelineEvent(distance,{remember:false});return}slug=resolved;selectedBody=slug;const p=bodyPosition(slug);controls.target.copy(p);if(distance==null){const body=BODY_DATA[slug],universeEntry=universeObjects[slug];if(body){distance=Math.max(body.radius*8,slug==="sun"?12:5);if(slug==="jupiter"||slug==="saturn")distance*=1.4;if(slug==="moon")distance=2.5}else if(universeEntry){distance=universeEntry.focusDistance||150}else{distance=180}}targetDistance=distance;avisar()}
  /* Porcentaje de la barra de zoom que corresponde a una distancia: es la inversa
     de setZoom(). Sin esto, mover la cámara a mano deja la barra marcando otra cosa
     y el primer golpe de rueda salta de vuelta a lo que dice la barra. */
  function zoomParaDistancia(distancia){
    const {min,max}=SOLAR_SYSTEM_BEHAVIOR.zoomDistance;
    const t=Math.log(Math.max(distancia,min)/min)/Math.log(max/min);
    return THREE.MathUtils.clamp(t,0,1)*100;
  }

  /* Encuadra el sistema completo: la órbita de Neptuno, que es la que manda, con
     el factor por el que las órbitas se separan al enfocar un cuerpo y un margen
     para que no quede pegada al borde. Sale del dato, así que añadir un planeta
     más lejos reencuadra solo. */
  function encuadrarSistemaSolar(){
    const alcance=Math.max(...BODY_ORDER.map(slug=>BODY_DATA[slug].orbitRadius))*SOLAR_SYSTEM_BEHAVIOR.focusedOrbitScale*1.28;
    focusOn("sun",alcance);
    // Antes de que exista el Sol no hay sistema que encuadrar: focusOn ya ha
    // caído en el evento cósmico y mover la barra encima solo despistaría.
    if(existsAt("sun"))setZoom(zoomParaDistancia(alcance));
  }

  /* Encuadra la galaxia entera, y desde fuera del plano.

     Desde casa la Vía Láctea se ve de canto, como una banda: estamos dentro del
     disco, y de ahí le viene el nombre. Para verla como en las fotos de galaxias
     —un óvalo con brazos— hay que salirse del plano, así que este botón lleva la
     cámara arriba y atrás. Enseñar las dos cosas, la banda y el óvalo, es media
     lección de por qué el cielo se ve como se ve. */
  function encuadrarViaLactea(){
    preferredFocus=null;selectedBody=null;
    /* El origen del grupo de la galaxia ES su centro: ahí estaba el núcleo antes
       de quitarlo, y el disco se construye centrado en él. */
    const centro=galaxy.getWorldPosition(new THREE.Vector3());
    objetivoLibre=centro.clone();
    const distancia=21000;
    controls.target.copy(centro);
    camera.position.copy(centro).addScaledVector(new THREE.Vector3(0.34,0.66,0.67).normalize(),distancia);
    targetDistance=distancia;
    setZoom(zoomParaDistancia(distancia));
  }

  function applyInitialLayout(){selectedEvent=TIMELINE_EVENTS.length-1;timelineProgress=selectedEvent;setZoom(SOLAR_SYSTEM_BEHAVIOR.initialZoom);earthMesh.material=getEarthMaterialByStage("modern");avisar();updateTemporalVisibility();focusOn("earth",SOLAR_SYSTEM_BEHAVIOR.initialFocusDistance)}
  function updatePlanetPositions(time,avance){BODY_ORDER.forEach((slug,index)=>{const body=BODY_DATA[slug],group=planetObjects[slug];if(slug==="sun"){group.rotation.y+=body.rotationSpeed/ROTATION_SLOWDOWN*avance;return}const position=getOrbitPosition(body,time,index,currentOrbitScale);group.position.set(position.x,position.y,position.z);group.children[0].rotation.y+=body.rotationSpeed/ROTATION_SLOWDOWN*avance});const moonPosition=getMoonOrbitPosition(BODY_DATA.moon,time);planetObjects.moon.position.set(moonPosition.x,moonPosition.y,moonPosition.z);moonMesh.rotation.y+=BODY_DATA.moon.rotationSpeed/ROTATION_SLOWDOWN*avance;earthClouds.rotation.y+=0.0012*avance;atmosphere.rotation.y-=0.0003*avance;saturnRings.rotation.z+=0.0008*avance;cuerposMenores.actualizar(time,currentOrbitScale)}
  function animateStageEffects(time,avance){eventVisuals.bigBang.rotation.y+=0.0014*avance;eventVisuals.firstStars.rotation.y+=0.00055*avance;eventVisuals.earlyGalaxy.rotation.y+=0.0012*avance;primordialTransition.stageStar.rotation.y+=0.003*avance;primordialTransition.stageSupernova.rotation.z+=0.004*avance;primordialTransition.stageQuasar.rotation.z+=0.002*avance;primordialTransition.group.rotation.y+=0.00025*avance;stageEffects.proto.rotation.y+=0.0035*avance;stageEffects.proto.children.forEach(child=>{if(child.userData.spin)child.rotation.z+=child.userData.spin*avance;if(child.userData.orbitRadius){child.userData.orbitAngle+=child.userData.orbitSpeed*avance;child.position.x=Math.cos(child.userData.orbitAngle)*child.userData.orbitRadius;child.position.z=Math.sin(child.userData.orbitAngle)*child.userData.orbitRadius}});if(stageEffects.proto.userData.shock)stageEffects.proto.userData.shock.scale.setScalar(1+Math.sin(time*1.5)*.08);if(stageEffects.proto.userData.protoSun)stageEffects.proto.userData.protoSun.scale.setScalar(1+Math.sin(time*4.2)*.055);stageEffects.earthDust.rotation.y+=0.015*avance;stageEffects.earthDust.scale.setScalar(1+Math.sin(time*2.4)*0.055);stageEffects.moonDebris.rotation.y+=0.02*avance;stageEffects.moonDebris.rotation.z+=0.006*avance;stageEffects.oceans.rotation.y+=0.006*avance;stageEffects.oceans.scale.setScalar(1+Math.sin(time*1.8)*0.025);stageEffects.oxidation.rotation.y+=0.004*avance;stageEffects.oxidation.scale.setScalar(1+Math.sin(time*2.2)*0.035);stageEffects.life.rotation.y+=0.0055*avance;stageEffects.life.scale.setScalar(1+Math.sin(time*3.1)*0.045)}
  function animateUniverseObjects(time,avance){Object.values(universeObjects).forEach(entry=>{if(entry.kind==="star"||entry.kind==="quasar")animateStellarObject(entry,time,avance)})}
  function updateWheelZoom(avance){if(Math.abs(zoomVelocity)<0.001)return;setZoom(THREE.MathUtils.clamp(zoomActual+zoomVelocity*avance,0,100));zoomVelocity*=Math.pow(0.82,avance);updateTemporalVisibility()}
  function actualizarMarcadorSolar(){
    const distancia=camera.position.length();
    const lejos=distancia>MARCADOR_DESDE;
    marcadorSolar.forEach(parte=>{parte.visible=lejos&&viaLactea.visible;});

    /* Fundido cruzado entre las dos maneras de dibujar la misma galaxia.

       La panorámica es la Vía Láctea vista desde dentro; el disco de puntos, la
       misma vista desde fuera. Enseñar las dos a la vez es dibujarla dos veces,
       y se notaba: la banda del cielo por un lado y el centro galáctico flotando
       por el otro, a la vez y sin relación aparente.

       Así que se turnan. Cerca del Sol solo la foto; al salir del vecindario la
       foto se apaga y el disco aparece en su sitio. El tramo del cambio es lo
       que cuenta: se ve cómo esa banda se convierte en ese disco. */
    const fuera=THREE.MathUtils.clamp(
      (distancia-CIELO.desdeAqui)/(CIELO.hastaAlli-CIELO.desdeAqui),0,1);

    cieloFoto.material.opacity=1-fuera;
    cieloFoto.visible=fuera<1&&backgroundStars.visible;

    nubesDeLaGalaxia.forEach(({parte,opacidadPlena})=>{
      parte.material.opacity=opacidadPlena*fuera;
      parte.visible=fuera>0.02;
    });
  }

  function animateCamera(avance){const desired=controls.target.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(targetDistance));camera.position.lerp(desired,suavizado(0.055,avance));const dist=camera.position.distanceTo(controls.target);camera.near=Math.max(0.01,dist/3000);camera.far=Math.max(40000,dist*8);camera.updateProjectionMatrix()}
  function syncSelectedTarget(avance){
    const destino=objetivoLibre??bodyPosition(selectedBody);
    controls.target.lerp(destino,suavizado(0.08,avance));
  }
  const reloj=crearReloj();
  /* `avance` son cuadros de referencia transcurridos: 1 a 120 Hz, 2 a 60. Todo lo
     que se mueve lo lleva como factor, así que la escena va igual de rápida en
     cualquier pantalla. Ver tiempo.js. */
  /* ── Interacción ──────────────────────────────────────────────────────── */

  const alGirarRueda = e => {
    e.preventDefault();
    zoomVelocity += THREE.MathUtils.clamp(e.deltaY, -160, 160) * 0.006;
  };
  renderer.domElement.addEventListener("wheel", alGirarRueda, { passive: false });

  /* Solo las pulsaciones sobre el lienzo eligen cuerpo: sin este filtro, pulsar
     un botón del panel lanzaba además un raycast que no acertaba nada y cerraba
     la ficha que ese mismo botón acababa de abrir. */
  const alPulsar = e => {
    if (e.target !== renderer.domElement) return;
    const caja = renderer.domElement.getBoundingClientRect();
    pointer.x = (e.clientX - caja.left) / caja.width * 2 - 1;
    pointer.y = -((e.clientY - caja.top) / caja.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const clickable = [];
    Object.values(planetObjects).forEach(group => group.traverse(obj => {
      if (obj.userData.clickable && isActuallyVisible(obj)) clickable.push(obj);
    }));
    Object.values(universeObjects).forEach(entry => {
      entry.object.traverse?.(obj => { if (obj.userData.clickable && isActuallyVisible(obj)) clickable.push(obj); });
      entry.label?.traverse?.(obj => { if (obj.userData.clickable && isActuallyVisible(obj)) clickable.push(obj); });
      entry.parts?.forEach(part => part.traverse?.(obj => { if (obj.userData.clickable && isActuallyVisible(obj)) clickable.push(obj); }));
    });
    const hits = raycaster.intersectObjects(clickable);
    /* Pulsar el vacío cierra la ficha pero no suelta la cámara: seguir a la
       Tierra y estar leyendo su ficha son decisiones separadas. */
    if (hits.length) { focusOn(hits[0].object.userData.slug); fichaAbierta = true; }
    else fichaAbierta = false;
    avisar();
  };
  window.addEventListener("pointerdown", alPulsar);

  const observador = new ResizeObserver(() => {
    camera.aspect = ancho() / alto();
    camera.updateProjectionMatrix();
    renderer.setSize(ancho(), alto());
  });
  observador.observe(contenedor);

  let cuadro = null, vivo = true;
  function animate(ms) {
    if (!vivo) return;
    const t = ms * .001, { avance } = reloj.paso(ms);
    updateWheelZoom(avance); syncOrbitScale(avance);
    updatePlanetPositions(t, avance); animateStageEffects(t, avance); animateUniverseObjects(t, avance);
    syncSelectedTarget(avance);
    /* Ni gira ni se escala con el zoom. Girarla movía el Sol —que está clavado
       en el origen— fuera de su sitio, y la escala por zoom era un parche de
       cuando el disco medía lo mismo que el vecindario. Una galaxia da una
       vuelta cada 200 millones de años: no hay giro que enseñar aquí. */
    updateTemporalVisibility();
    animateCamera(avance);
    actualizarMarcadorSolar();
    controls.update();
    renderer.render(scene, camera);
    cuadro = requestAnimationFrame(animate);
  }

  applyInitialLayout();
  avisar();
  cuadro = requestAnimationFrame(animate);

  return {
    /* La interfaz manda estas órdenes; el estado sigue viviendo en la escena y
       vuelve por `alCambiar`. Es el mismo reparto que en las otras vistas. */
    irAEtapa(valor, opciones) { selectTimelineProgress(valor, opciones); },
    ponerZoom(valor) { zoomVelocity = 0; setZoom(Number(valor)); updateTemporalVisibility(); avisar(); },
    /* Enfocar un cuerpo es elegirlo, y elegir es lo que abre la ficha.
       Encuadrar el sistema no elige nada: si la ficha estaba abierta se queda
       como estaba, mostrando lo que pase a estar enfocado. */
    enfocar(slug) { focusOn(slug); fichaAbierta = true; avisar(); },
    enfocarTierra() { focusOn("earth", 7); fichaAbierta = true; avisar(); },
    enfocarSistemaSolar() { encuadrarSistemaSolar(); avisar(); },
    enfocarViaLactea() { encuadrarViaLactea(); avisar(); },
    cerrarFicha() { fichaAbierta = false; avisar(); },
    desmontar() {
      if (!vivo) return;
      vivo = false;
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      window.removeEventListener("pointerdown", alPulsar);
      renderer.domElement.removeEventListener("wheel", alGirarRueda);
      controls.dispose();
      liberarEscena(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}
