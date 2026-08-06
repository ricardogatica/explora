import * as THREE from "three";

export function makePlanetTexture(kind,colorHex){
  const c=document.createElement("canvas");c.width=1024;c.height=512;
  const ctx=c.getContext("2d"),grad=ctx.createLinearGradient(0,0,0,c.height);
  if(kind==="sun"){
    grad.addColorStop(0,"#fff4b0");grad.addColorStop(0.5,"#ffba45");grad.addColorStop(1,"#ff6d00");ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<1800;i++){ctx.fillStyle=`rgba(255, ${160+Math.random()*90}, 0, ${0.02+Math.random()*0.06})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,20+Math.random()*80,0,Math.PI*2);ctx.fill()}
  }else if(kind.startsWith("earth-")){
    const oceanColors={"earth-modern":["#083c68","#1f7bbd"],"earth-pangaea":["#0b416d","#2d7cbe"],"earth-breakup1":["#0a3a64","#2d7bb8"],"earth-breakup2":["#0b436f","#3b91cf"],"earth-archaean":["#0c3b47","#1e7a7a"],"earth-proterozoic":["#114f6d","#298f96"],"earth-paleozoic":["#104a76","#2e86bc"],"earth-molten":["#2a0f05","#8b1f0e"]};
    grad.addColorStop(0,oceanColors[kind][0]);grad.addColorStop(1,oceanColors[kind][1]);ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
    function drawMasses(masses,fill,stroke=null){ctx.fillStyle=fill;if(stroke)ctx.strokeStyle=stroke;masses.forEach(m=>{ctx.beginPath();ctx.moveTo(m[0][0],m[0][1]);for(let i=1;i<m.length;i++)ctx.lineTo(m[i][0],m[i][1]);ctx.closePath();ctx.fill();if(stroke)ctx.stroke()})}
    if(kind==="earth-molten"){
      for(let i=0;i<900;i++){ctx.fillStyle=`rgba(255, ${80+Math.random()*100}, 0, ${0.05+Math.random()*0.08})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,10+Math.random()*35,0,Math.PI*2);ctx.fill()}
    }else{
      const pangea=[[[250,120],[380,90],[520,110],[660,140],[760,190],[770,260],[710,320],[640,350],[600,390],[500,410],[420,400],[340,360],[290,310],[240,250],[220,180]]],breakup1=[[[220,130],[340,100],[430,110],[470,180],[430,260],[330,260],[250,210],[210,170]],[[470,120],[610,140],[720,190],[710,290],[630,330],[540,310],[500,240],[500,170]],[[420,270],[520,300],[570,390],[470,420],[380,380],[370,310]]],breakup2=[[[170,145],[280,115],[330,150],[320,260],[240,300],[180,240]],[[360,100],[460,110],[515,150],[520,230],[470,280],[390,260],[350,200]],[[570,130],[665,180],[670,270],[620,320],[560,290],[540,210]],[[440,290],[520,325],[555,405],[505,455],[435,425],[395,355]],[[740,180],[790,220],[770,280],[725,250]]],modern=[[[110,120],[200,90],[250,115],[260,190],[210,245],[130,225],[95,170]],[[245,235],[315,275],[325,390],[275,465],[215,395],[220,300]],[[385,110],[460,105],[520,130],[550,190],[510,235],[430,210],[390,150]],[[530,145],[670,140],[770,190],[800,260],[710,330],[620,310],[590,240]],[[435,225],[520,255],[540,365],[470,425],[395,355],[390,270]],[[735,350],[810,380],[790,430],[710,415]],[[330,35],[380,20],[440,35],[420,70],[345,65]],[[50,430],[950,430],[910,485],[90,485]]],archaean=[[[220,145],[360,125],[470,145],[520,205],[465,300],[315,290],[215,230]],[[580,180],[710,210],[735,320],[630,350],[555,290]]],proterozoic=[[[180,130],[300,110],[410,125],[450,210],[395,275],[270,290],[180,235]],[[455,135],[600,145],[710,200],[720,300],[620,340],[500,290],[455,220]],[[380,300],[470,330],[500,410],[420,455],[350,390]]],paleozoic=[[[210,125],[350,95],[470,120],[555,175],[540,270],[440,320],[310,300],[225,245]],[[560,165],[700,195],[730,315],[640,350],[555,280]]],fills={"earth-pangaea":"#768f5f","earth-breakup1":"#879b65","earth-breakup2":"#8b9d67","earth-modern":"#6d915f","earth-archaean":"#6f7750","earth-proterozoic":"#7b8658","earth-paleozoic":"#7e915d"},mapping={"earth-pangaea":pangea,"earth-breakup1":breakup1,"earth-breakup2":breakup2,"earth-modern":modern,"earth-archaean":archaean,"earth-proterozoic":proterozoic,"earth-paleozoic":paleozoic};
      drawMasses(mapping[kind],fills[kind],"rgba(0,0,0,.18)");
      for(let i=0;i<600;i++){ctx.fillStyle=`rgba(255,255,255,${0.02+Math.random()*0.03})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,8+Math.random()*26,0,Math.PI*2);ctx.fill()}
      if(kind==="earth-modern"){ctx.fillStyle="rgba(245,248,255,.9)";ctx.fillRect(0,0,c.width,25);ctx.fillRect(0,c.height-25,c.width,25)}
    }
  }else{
    ctx.fillStyle=`#${new THREE.Color(colorHex).getHexString()}`;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<500;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.06})`;ctx.beginPath();ctx.arc(Math.random()*c.width,Math.random()*c.height,5+Math.random()*25,0,Math.PI*2);ctx.fill()}
    if(kind==="venus"){for(let y=0;y<c.height;y+=24){ctx.fillStyle=`rgba(255,255,255,${0.05+Math.random()*0.05})`;ctx.fillRect(0,y,c.width,12+Math.random()*10)}}
    if(["jupiter","saturn","uranus","neptune"].includes(kind)){for(let y=0;y<c.height;y+=22){ctx.fillStyle=`rgba(255,255,255,${0.07+Math.random()*0.1})`;ctx.fillRect(0,y,c.width,9+Math.random()*18)}if(kind==="jupiter"){ctx.fillStyle="rgba(180,90,60,.35)";ctx.beginPath();ctx.ellipse(c.width*0.72,c.height*0.58,75,48,0,0,Math.PI*2);ctx.fill()}}
    if(["mars","mercury","moon"].includes(kind)){for(let i=0;i<80;i++){ctx.strokeStyle=`rgba(0,0,0,${0.08+Math.random()*0.14})`;ctx.beginPath();const x=Math.random()*c.width,y=Math.random()*c.height,r=8+Math.random()*35;ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}}
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

export function materialForBody(body,slug,stage="modern"){
  if(slug==="sun")return new THREE.MeshBasicMaterial({map:makePlanetTexture("sun",body.color)});
  const kind=slug==="earth"?`earth-${stage}`:slug;
  return new THREE.MeshStandardMaterial({map:makePlanetTexture(kind,body.color),roughness:1});
}

export function createBodyMaterials(BODY_DATA){
  return {
    sun:materialForBody(BODY_DATA.sun,"sun"),
    mercury:materialForBody(BODY_DATA.mercury,"mercury"),
    venus:materialForBody(BODY_DATA.venus,"venus"),
    earthModern:materialForBody(BODY_DATA.earth,"earth","modern"),
    earthPangaea:materialForBody(BODY_DATA.earth,"earth","pangaea"),
    earthBreakup1:materialForBody(BODY_DATA.earth,"earth","breakup1"),
    earthBreakup2:materialForBody(BODY_DATA.earth,"earth","breakup2"),
    earthArchaean:materialForBody(BODY_DATA.earth,"earth","archaean"),
    earthProterozoic:materialForBody(BODY_DATA.earth,"earth","proterozoic"),
    earthPaleozoic:materialForBody(BODY_DATA.earth,"earth","paleozoic"),
    earthMolten:materialForBody(BODY_DATA.earth,"earth","molten"),
    moon:materialForBody(BODY_DATA.moon,"moon"),
    mars:materialForBody(BODY_DATA.mars,"mars"),
    jupiter:materialForBody(BODY_DATA.jupiter,"jupiter"),
    saturn:materialForBody(BODY_DATA.saturn,"saturn"),
    uranus:materialForBody(BODY_DATA.uranus,"uranus"),
    neptune:materialForBody(BODY_DATA.neptune,"neptune")
  };
}

export function createBodyMesh(body,slug,{scale=1,stage="modern"}={}){
  return new THREE.Mesh(new THREE.SphereGeometry(body.radius*scale,64,64),materialForBody(body,slug,stage));
}

export function createSunGlow(radius,scale=1.16){
  return new THREE.Mesh(new THREE.SphereGeometry(radius*scale,48,48),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:0.25,blending:THREE.AdditiveBlending,depthWrite:false}));
}

export function createSaturnRings(radius,{inner=1.25,outer=2,segments=64}={}){
  const rings=new THREE.Mesh(new THREE.RingGeometry(radius*inner,radius*outer,segments),new THREE.MeshBasicMaterial({color:0xd6c6a0,side:THREE.DoubleSide,transparent:true,opacity:0.65}));
  rings.rotation.x=Math.PI/2.6;return rings;
}
