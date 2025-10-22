import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';
import { voronoiCells, simplexNoise, marble, rust, stars } from 'tsl-textures';

class PolishedConcreteMaterial extends THREE.MeshStandardNodeMaterial {
  constructor({
    // color1 = new THREE.Color(0x7c8594),
    // color2 = new THREE.Color(0x515357),
    // color3 = new THREE.Color(0x272c36),
    color1 = new THREE.Color(0x484a4f),
    color2 = new THREE.Color(0x5f626b),
    color3 = new THREE.Color(0x121314),
    roughness = 1.0,
    // controles de grietas / máscara
    cracksScale = 3.0,
    cracksDarkness = 1.0,
    cracksThickness = 30.0,   // controla ancho del rango smoothstep
    cracksOpacity = 1.0,     // opacidad máxima de las grietas
    cracksThreshold = 1.0,   // centro del rango de smoothstep (0..1)
    // control para rusty
    rustyOpacity = 0.0,
  } = {}) {
    super();

    // --- Procedural maps ---
    // simplexNoise devuelve un nodo (vec3). Lo usaremos como color y como base para alpha.
    const simpleNoiseBase = simplexNoise({
      scale: -2.5,
      balance: 0.5,
      contrast: 0.25,
      color:  color1,     // color base del ruido (si aplica)
      background: color2,// background del nodo
      seed: 0,
    });

    const simpleNoiseMix = simplexNoise({
      scale: -2.5,
      balance: 0,
      contrast: 0,
      color: new THREE.Color(0xFFFFFF),     // color base del ruido (si aplica)
      background: new THREE.Color(0x000000),// background del nodo
      seed: 12,
    });

    const cracks = marble({
      scale: -2,
      thinness: cracksThickness,
      noise: 1,
      color: color3,
      background: color2,
      seed: 2,
    });

    const rusty = rust({
      scale: 0,
      iterations: 4,
      amount: -0.0,
      opacity: rustyOpacity,
      noise: 0,
      noiseScale: 0.1,
      color: color3,
      background:color2,
      seed: 0,
    });


    const starsNoise = stars ( {
      scale: 0,
      density: 3,
      variation: 0.38,
      color: color1,
      background: color3,
      seed: 0
    } )


    // --- Main node: mezclamos el ruido base (simpleNoiseBase) con el color de grietas
    // --- pero SOLO donde simpleNoiseMix controla la máscara (smoothstep)
    const main = TSL.Fn(() => {
  
      const mixedColor =TSL.vec3(simpleNoiseBase);

      const rustyColor = TSL.vec3(rusty)
      mixedColor.assign(TSL.mix( mixedColor, rustyColor, TSL.float(0.05)))
      mixedColor.assign(TSL.mix( mixedColor, starsNoise, TSL.float(0.2)))
      // devolvemos vec4 (RGB + alfa). Aquí ponemos alfa a 1.0 por defecto.
      // Si prefieres que la geometría sea realmente transparente fuera de la máscara,
      // activa material.transparent = true y asigna this.opacityNode = maskAlpha (ver abajo).
      return TSL.vec4(mixedColor, TSL.float(1.0));
    });



    // --- Asignaciones al material ---
    this.colorNode = main();
    this.roughnessNode = TSL.float(roughness);
    this.metalness = 0.0;
  




    // Opcional: si quieres que el mask también controle la opacidad real del material
    // (es decir, las partes sin grieta sean transparentes), descomenta las dos líneas
    // siguientes. Ten en cuenta que al usar transparencia necesitas manejar renderOrder,
    // depthWrite, y estos casos pueden requerir ajustes adicionales.
    // this.transparent = true;
    // this.opacityNode = TSL.Fn(() => { const lower = TSL.float(cracksThreshold - (cracksThickness * 0.5)); const upper = TSL.float(cracksThreshold + (cracksThickness * 0.5)); return TSL.mul(TSL.smoothstep(lower, upper, TSL.float(simpleNoiseMix.r)), TSL.float(cracksOpacity)); })();
  }
}

export default PolishedConcreteMaterial;



//  // --- parámetros derivados para smoothstep (mismo enfoque que antes) ---
//     const halfWidth = Math.max(0.001, Math.min(0.5, cracksThickness * 0.05));
//     const lowerVal = Math.max(0.0, cracksThreshold - halfWidth);
//     const upperVal = Math.min(1.0, cracksThreshold + halfWidth);

//     // --- Construcción del nodo final ---
//     // base simple entre color1 y color2
//     const baseColor = TSL.mix(color1, color2, TSL.float(0.5));

//     // 1) Noise como color overlay
//     const noiseColor = TSL.vec3(simpleNoise); // vec3

//     // 2) Usar ese mismo noise para generar alpha de las cracks
//     //    Podemos convertir a float con luminancia o tomar el canal R directamente.
//     const lumaWeights = TSL.vec3(0.2126, 0.7152, 0.0722);
//     const noiseLuma = TSL.dot(noiseColor, lumaWeights); // float

//     // --- alternativa: usar canal R directamente (comentar si no quieres)
//     // const noiseAlphaRaw = noiseColor.x;

//     // 3) Ajustar/afinar la máscara con smoothstep (controla grosor/umbral)
//     const alphaCracks = TSL.smoothstep(
//       TSL.float(lowerVal),
//       TSL.float(upperVal),
//       noiseLuma
//     ).mul(TSL.float(cracksOpacity)); // alpha final para las cracks

//     // 4) Color de las cracks (oscurecimiento controlable)
//     const cracksColor = TSL.vec3(cracks).mul(TSL.float(cracksDarkness));

//     // 5) Componer: cracks sobre base usando alphaCracks
//     const afterCracks = TSL.mix(baseColor, cracksColor, 1.0);

//     // 6) Aplicar el noiseColor como overlay sutil (usa mismo noise)
//     //    Puedes controlar la intensidad del overlay con un parámetro.
//     const noiseOverlayIntensity = TSL.float(0.12);
//     const afterNoise = TSL.mix(afterCracks, noiseColor, noiseOverlayIntensity);



    // // --- Textura procedural base ---
    // // Ruido para simular irregularidades suaves del cemento alisado
    // const uv = TSL.uv().mul(noiseScale)
    // const n1 = TSL.mx_noise_float(uv)
    // const n2 = TSL.mx_noise_float(uv.mul(2))
    // const combinedNoise = TSL.mix(n1, n1, 0.5)

    // // --- Variación de color sutil ---
    // const colorVar = baseColor.add(combinedNoise.mul(variation))

    // // --- Rugosidad variable ---
    // const roughVar = TSL.float(roughness).add(combinedNoise.mul(0.2))

    // // --- Pequeñas vetas o marcas alisadas ---
    // const streaks = TSL.sin(uv.y.mul(3.0)).mul(0.05)
    // const polished = TSL.mix(colorVar, colorVar.add(TSL.vec3(0.05)), TSL.smoothstep(0.4, 0.6, streaks))





/* model.material.transparent = true;
model.material.opacity = 1;
model.material.side = THREE.DoubleSide;
model.material.opacityNode = rust.opacity ( {
	scale: 2,
	iterations: 8,
	amount: -0.3,
	opacity: 0.55,
	noise: 0.5,
	noiseScale: 0.5,
	color: new THREE.Color(11974326),
	background: new THREE.Color(8487297),
	seed: 0
} );
 */