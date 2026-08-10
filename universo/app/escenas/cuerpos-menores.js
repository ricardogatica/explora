import * as THREE from "three";

/* Los cuerpos menores del sistema solar: el cinturón de asteroides y dos cometas.

   El sistema solar no son nueve bolas y unas elipses. Entre Marte y Júpiter hay
   un millón de rocas de más de un kilómetro, y de vez en cuando cruza un cometa
   con la cola apuntando al lado contrario del Sol. Sin eso, la vista enseña un
   sistema solar más ordenado y más vacío del que hay.

   ── Sobre la memoria ──────────────────────────────────────────────────────

   El cinturón es UNA geometría de puntos, no dos mil objetos. Dos mil mallas
   serían dos mil llamadas de dibujo, dos mil matrices que recalcular en cada
   cuadro y un recorrido del grafo que se nota; esto son 2.200 posiciones en un
   Float32Array —26 KB— y una sola llamada. Girar el cinturón es girar el grupo
   que lo contiene, no mover un solo punto.

   Los cometas sí son objetos, porque son dos y cada uno necesita su cola
   orientada: una esfera diminuta y dos conos superpuestos.

   ── Sobre la escala ───────────────────────────────────────────────────────

   Las órbitas de esta vista están comprimidas —Neptuno está a 34 unidades y no
   a las 5.900 que le tocarían—, así que las de los cometas también lo están.
   Lo que se conserva es lo que se puede enseñar: que el cinturón cae entre
   Marte y Júpiter, que la órbita de un cometa es una elipse muy estirada y muy
   inclinada frente a la de los planetas, y que la cola siempre huye del Sol. */

/* Dos cometas conocidos. Los periodos son los de verdad; la elipse está
   comprimida como todo lo demás en esta vista. */
const COMETAS = [
  {
    slug: "halley", nombre: "Halley", periodo: "76 años",
    semieje: 26, excentricidad: 0.82, inclinacion: 0.55, giro: 0.9,
    vuelta: 168, nucleo: 0.28, cola: 6.4,
    colorIon: 0x8fd4ff, colorPolvo: 0xffe9c0
  },
  {
    slug: "encke", nombre: "Encke", periodo: "3,3 años",
    semieje: 13.5, excentricidad: 0.72, inclinacion: -0.28, giro: 2.4,
    vuelta: 74, nucleo: 0.2, cola: 4.2,
    colorIon: 0x9be8d8, colorPolvo: 0xfff0d2
  }
];

function crearCinturon({ interior, exterior, cantidad = 2200 }) {
  const posiciones = new Float32Array(cantidad * 3);
  const colores = new Float32Array(cantidad * 3);

  for (let i = 0; i < cantidad; i++) {
    /* La raíz reparte las rocas por igual en el ÁREA del anillo. Sin ella se
       amontonan contra el borde interior, que es donde hay menos sitio. */
    const t = Math.sqrt(Math.random());
    const radio = interior + (exterior - interior) * t;
    const angulo = Math.random() * Math.PI * 2;
    /* El cinturón real es un disco grueso: las inclinaciones llegan a 20°, así
       que no es un aro plano. Se estrecha hacia fuera, como el de verdad. */
    const grosor = 0.55 + (1 - t) * 0.5;

    posiciones[i * 3] = Math.cos(angulo) * radio;
    posiciones[i * 3 + 1] = (Math.random() - .5) * grosor;
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio;

    // Grises con algo de variación: son roca, no estrellas.
    const brillo = 0.55 + Math.random() * 0.45;
    colores[i * 3] = brillo;
    colores[i * 3 + 1] = brillo * 0.96;
    colores[i * 3 + 2] = brillo * 0.88;
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  geometria.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  return new THREE.Points(geometria, new THREE.PointsMaterial({
    size: 0.085, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false
  }));
}

/* Una cola de cometa, hecha de polvo. Se construye en el eje +Y y luego se
   orienta: quien la coloca decide hacia dónde apunta. */
function crearCola({ color, particulas, largo, apertura, tamano, opacidad }) {
  const posiciones = new Float32Array(particulas * 3);
  const colores = new Float32Array(particulas * 3);
  const tinte = new THREE.Color(color);

  for (let i = 0; i < particulas; i++) {
    /* Al cuadrado: se amontonan cerca del núcleo, que es donde la cola es densa
       y brillante, y se van espaciando hacia el final. */
    const t = Math.pow(Math.random(), 2);
    const radio = Math.sqrt(Math.random()) * apertura * (0.12 + t);
    const angulo = Math.random() * Math.PI * 2;

    posiciones[i * 3] = Math.cos(angulo) * radio;
    posiciones[i * 3 + 1] = t * largo;
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio;

    const brillo = (1 - t) * (0.55 + Math.random() * 0.45);
    colores[i * 3] = tinte.r * brillo;
    colores[i * 3 + 1] = tinte.g * brillo;
    colores[i * 3 + 2] = tinte.b * brillo;
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  geometria.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  const polvo = new THREE.Points(geometria, new THREE.PointsMaterial({
    size: tamano, vertexColors: true, transparent: true,
    opacity: opacidad, blending: THREE.AdditiveBlending, depthWrite: false
  }));

  const soporte = new THREE.Group();
  soporte.add(polvo);
  return soporte;
}

function crearCometa(datos) {
  const grupo = new THREE.Group();

  const nucleo = new THREE.Mesh(
    new THREE.SphereGeometry(datos.nucleo, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  grupo.add(nucleo);

  /* Dos colas, no una, y es la diferencia entre parecer un cometa y no.

     La de IONES es gas que el Sol ha cargado eléctricamente: el viento solar se
     lo lleva a 400 km/s, así que sale recta y apunta exactamente al lado
     opuesto al Sol, sin importar hacia dónde vaya el cometa. Es la azulada y
     estrecha.

     La de POLVO son granos, y los granos tienen inercia: salen despedidos más
     despacio y se quedan atrás en la órbita, así que la cola se curva y queda
     rezagada respecto de la de iones. Es la ancha y amarillenta.

     En las fotos de un cometa brillante se ven las dos separándose en «V». Con
     una sola cola no hay nada que explicar; con dos, se explica el viento
     solar. */
  const colaIon = crearCola({
    color: datos.colorIon, particulas: 260, largo: datos.cola,
    apertura: datos.nucleo * 1.5, tamano: datos.nucleo * 0.42, opacidad: 0.85
  });
  const colaPolvo = crearCola({
    color: datos.colorPolvo, particulas: 320, largo: datos.cola * 0.62,
    apertura: datos.nucleo * 4.2, tamano: datos.nucleo * 0.5, opacidad: 0.6
  });
  grupo.add(colaIon);
  grupo.add(colaPolvo);

  /* La coma: la atmósfera de gas y polvo que envuelve el núcleo. Es lo que hace
     que un cometa se vea como una mancha difusa y no como un punto. */
  const coma = new THREE.Mesh(
    new THREE.SphereGeometry(datos.nucleo * 2.4, 20, 20),
    new THREE.MeshBasicMaterial({
      color: datos.colorIon, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  grupo.add(coma);

  const perihelio = datos.semieje * (1 - datos.excentricidad);
  return { grupo, colaIon, colaPolvo, coma, datos, perihelio };
}

/* `hacerEtiqueta` la presta la escena, para que los rótulos se vean igual que
   los de los planetas y no invente esta pieza su propia tipografía. */
export function crearCuerposMenores({ interior, exterior, hacerEtiqueta }) {
  const grupo = new THREE.Group();

  const cinturon = crearCinturon({ interior, exterior });
  grupo.add(cinturon);

  if (hacerEtiqueta) {
    const rotulo = hacerEtiqueta("Cinturón de asteroides");
    rotulo.position.set(0, 1.6, -(interior + exterior) / 2);
    grupo.add(rotulo);
  }

  const cometas = COMETAS.map(datos => {
    const cometa = crearCometa(datos);
    if (hacerEtiqueta) {
      const rotulo = hacerEtiqueta(datos.nombre);
      rotulo.position.set(0, datos.nucleo + 0.9, 0);
      cometa.grupo.add(rotulo);
    }
    grupo.add(cometa.grupo);
    return cometa;
  });

  /* Vectores de trabajo, creados una vez. Dentro del bucle de animación cada
     `new THREE.Vector3()` sería basura que recoger sesenta veces por segundo. */
  const desdeElSol = new THREE.Vector3();
  const avance = new THREE.Vector3();
  const anterior = new THREE.Vector3();
  const arriba = new THREE.Vector3(0, 1, 0);
  const rezagada = new THREE.Vector3();

  /* Cuánto «trabaja» el cometa: 0 lejos y dormido, 1 en su punto más cercano al
     Sol. El exponente 2,2 es lo que hace que la cola brote de golpe al acercarse
     en vez de crecer poco a poco, que es lo que pasa de verdad: la sublimación
     del hielo depende muy fuerte de la temperatura, y esta de la distancia. */
  const actividad = (perihelio, distancia) => {
    const bruta = Math.pow(Math.max(perihelio, 0.001) / Math.max(distancia, perihelio), 2.2);
    return THREE.MathUtils.clamp((bruta - 0.12) / 0.88, 0, 1);
  };

  /* Posición en la elipse, con el Sol en un foco. Se saca aparte porque hace
     falta dos veces: dónde está ahora y dónde estaba un instante antes, que es
     de donde sale la dirección en la que viaja. */
  const enLaOrbita = (datos, angulo, destino) => {
    const a = datos.semieje, b = a * Math.sqrt(1 - datos.excentricidad ** 2);
    const x = a * (Math.cos(angulo) - datos.excentricidad);
    const z = b * Math.sin(angulo);
    return destino.set(
      x * Math.cos(datos.giro) - z * Math.sin(datos.giro),
      Math.sin(angulo) * a * datos.inclinacion * 0.28,
      x * Math.sin(datos.giro) + z * Math.cos(datos.giro)
    );
  };

  return {
    grupo,
    /* `escalaOrbital` es la misma con la que se separan las órbitas de los
       planetas al enfocar o alejar: sin aplicarla, el cinturón se quedaba
       clavado mientras Marte y Júpiter se abrían, y acababa dentro de Marte. */
    actualizar(tiempo, escalaOrbital) {
      grupo.scale.setScalar(escalaOrbital);
      // El cinturón gira entero: es una vuelta de unos cinco años.
      cinturon.rotation.y = tiempo * 0.06;

      for (const cometa of cometas) {
        const { grupo: cuerpo, colaIon, colaPolvo, coma, datos, perihelio } = cometa;
        const angulo = (tiempo / datos.vuelta) * Math.PI * 2;

        enLaOrbita(datos, angulo, cuerpo.position);
        // Un pelín antes en la órbita: la resta da hacia dónde va.
        enLaOrbita(datos, angulo - 0.02, anterior);
        avance.copy(cuerpo.position).sub(anterior).normalize();

        const distancia = cuerpo.position.length();
        const trabajo = actividad(perihelio, distancia);

        /* La de iones, al lado exacto contrario del Sol. */
        desdeElSol.copy(cuerpo.position).normalize();
        colaIon.quaternion.setFromUnitVectors(arriba, desdeElSol);
        colaIon.scale.setScalar(0.18 + trabajo * 1.5);

        /* La de polvo, entre esa dirección y la de detrás del cometa: los granos
           se quedan rezagados en la órbita. Interpolar entre las dos direcciones
           y volver a normalizar da la curva sin tener que integrar nada. */
        rezagada.copy(desdeElSol).addScaledVector(avance, -0.42).normalize();
        colaPolvo.quaternion.setFromUnitVectors(arriba, rezagada);
        colaPolvo.scale.setScalar(0.14 + trabajo * 1.25);

        // La coma también crece con el trabajo, y el núcleo brilla más de cerca.
        coma.scale.setScalar(0.5 + trabajo * 1.1);
        coma.material.opacity = 0.05 + trabajo * 0.22;
      }
    }
  };
}
