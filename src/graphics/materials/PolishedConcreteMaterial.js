import * as TSL from 'three/tsl'
import * as THREE from 'three/webgpu'
import { simplexNoise, rust } from 'tsl-textures'

class PolishedConcreteMaterial extends THREE.MeshStandardNodeMaterial {
  constructor({
    color1 = new THREE.Color(0x30363B),
    color2 = new THREE.Color(0x313438),
    color3 = new THREE.Color(0x16181B),
  } = {}) {
    super()

    const simpleNoiseBase = simplexNoise({
      scale: -3.5,
      balance: 0.25,
      contrast: 0,
      color:  color1,     
      background: color3, 
      seed: 0,
    })

    const rusty = rust({
      scale: 0,
      iterations: 2,
      amount: -0.05,
      opacity: 1,
      noise: 0.1,
      noiseScale: 0.1,
      color: color2,
      background:color3,
      seed: 0,
    })

    const main = TSL.Fn(() => {
      const mixedColor =TSL.vec3(simpleNoiseBase)
      const rustyColor = TSL.vec3(rusty)
      mixedColor.assign(TSL.mix( mixedColor, rustyColor, TSL.float(0.1)))
   
      return TSL.vec4(mixedColor, TSL.float(1.0))
    });

    this.colorNode = main()
    this.roughnessNode = TSL.float(1.0)
  }
}

export default PolishedConcreteMaterial;
