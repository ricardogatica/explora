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
    vuelta: 168, color: 0xbfe8ff, nucleo: 0.28, cola: 5.2
  },
  {
    slug: "encke", nombre: "Encke", periodo: "3,3 años",
    semieje: 13.5, excentricidad: 0.72, inclinacion: -0.28, giro: 2.4,
    vuelta: 74, color: 0xd7f0d0, nucleo: 0.2, cola: 3.4
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

function crearCometa(datos) {
  const grupo = new THREE.Group();

  const nucleo = new THREE.Mesh(
    new THREE.SphereGeometry(datos.nucleo, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  grupo.add(nucleo);

  /* La cola sale del núcleo y se orienta en cada cuadro para huir del Sol, que
     es lo que hace de verdad: no la peina el movimiento, la empuja el viento
     solar, así que apunta al lado contrario del Sol tanto si el cometa va como
     si vuelve. Es la parte contraintuitiva y por eso vale la pena verla.

     De polvo y no de conos. Un cono, por transparente que sea, tiene silueta:
     se veía una cuña gris de bordes rectos, que es justo lo que una cola no
     tiene. Con partículas que se abren y se apagan a lo largo, la cola se
     deshace por el extremo como en las fotos. Son 220 puntos en una sola
     geometría por cometa: menos memoria que los dos conos que sustituyen. */
  const PARTICULAS = 220;
  const posiciones = new Float32Array(PARTICULAS * 3);
  const colores = new Float32Array(PARTICULAS * 3);
  const tinte = new THREE.Color(datos.color);

  for (let i = 0; i < PARTICULAS; i++) {
    /* Al cuadrado: se amontonan cerca del núcleo, que es donde la cola es
       densa y brillante, y se van espaciando hacia el final. */
    const t = Math.pow(Math.random(), 2);
    const largo = t * datos.cola;
    const apertura = datos.nucleo * (0.35 + t * 3.2);
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.sqrt(Math.random()) * apertura;

    posiciones[i * 3] = Math.cos(angulo) * radio;
    posiciones[i * 3 + 1] = largo;
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
    size: datos.nucleo * 0.55, vertexColors: true, transparent: true,
    opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false
  }));

  const soporteCola = new THREE.Group();
  soporteCola.add(polvo);
  grupo.add(soporteCola);

  return { grupo, soporteCola, datos };
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

  const alSol = new THREE.Vector3();
  const arriba = new THREE.Vector3(0, 1, 0);

  return {
    grupo,
    /* `escalaOrbital` es la misma con la que se separan las órbitas de los
       planetas al enfocar o alejar: sin aplicarla, el cinturón se quedaba
       clavado mientras Marte y Júpiter se abrían, y acababa dentro de Marte. */
    actualizar(tiempo, escalaOrbital) {
      grupo.scale.setScalar(escalaOrbital);
      // El cinturón gira entero: es una vuelta de unos cinco años.
      cinturon.rotation.y = tiempo * 0.06;

      for (const { grupo: cuerpo, soporteCola, datos } of cometas) {
        const angulo = (tiempo / datos.vuelta) * Math.PI * 2;
        /* Elipse con el Sol en un foco, no en el centro: por eso el término de
           la excentricidad se resta del coseno. Es lo que hace que el cometa
           pase deprisa y cerca por un lado y despacio y lejos por el otro. */
        const a = datos.semieje, b = a * Math.sqrt(1 - datos.excentricidad ** 2);
        const x = a * (Math.cos(angulo) - datos.excentricidad);
        const z = b * Math.sin(angulo);
        cuerpo.position.set(
          x * Math.cos(datos.giro) - z * Math.sin(datos.giro),
          Math.sin(angulo) * a * datos.inclinacion * 0.28,
          x * Math.sin(datos.giro) + z * Math.cos(datos.giro)
        );

        /* La cola huye del Sol, que está en el origen. Más larga cuanto más
           cerca: el hielo se sublima con el calor, y por eso un cometa lejano
           no tiene cola. */
        alSol.copy(cuerpo.position).normalize();
        soporteCola.quaternion.setFromUnitVectors(arriba, alSol);
        const cercania = THREE.MathUtils.clamp(1 - cuerpo.position.length() / (a * 1.9), 0, 1);
        soporteCola.scale.setScalar(0.25 + cercania * 1.5);
      }
    }
  };
}
