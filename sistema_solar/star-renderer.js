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

export function createStarObject(star,{detail=false}={}){
  const group=new THREE.Group();
  if(!detail)group.position.set(...star.position);
  group.userData.slug=star.slug;group.userData.kind=star.kind||"star";group.userData.clickable=true;
  const radius=Math.max(star.size*(detail?.42:.9),detail?1.8:5.5);
  const core=new THREE.Mesh(new THREE.SphereGeometry(radius,48,48),new THREE.MeshBasicMaterial({color:star.color}));
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

export function animateStellarObject(entry,time){
  const group=entry.group||entry.object||entry;
  if(entry.kind==="quasar"||group.userData.kind==="quasar"){
    group.rotation.y+=.0015;
    group.children.forEach((child,index)=>{if(child.geometry?.type==="RingGeometry")child.rotation.z+=.003+index*.0004;if(child.geometry?.type==="PlaneGeometry")child.scale.y=1+Math.sin(time*2.4+index)*.18});
  }else{
    group.rotation.y+=.0006;
    const glow=entry.glow||group.children.find(child=>child.isSprite);
    if(glow)glow.scale.multiplyScalar(1+Math.sin(time*2.1)*.0008);
  }
}
