import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class LightMaterial extends THREE.MeshPhysicalNodeMaterial {
  constructor({ baseColor = 0xFFFFFF, intensity = 0, maxIntensity = 1 } = {}) {
    super()

    // Uniforms: se pueden cambiar en runtime sin recompilar el shader
    this.colorUniform = TSL.uniform(new THREE.Color(baseColor))
    this.intensityNode = TSL.uniform(intensity)
    this.maxIntensity = maxIntensity

    // Nodo de color base
    this.colorNode = this.colorUniform

    // Nodo emisivo = color * intensidad
    this.emissiveNode = this.colorUniform.mul(this.intensityNode)

    // Evita clamping
    this.toneMapped = false
    this.roughnessNode = TSL.float(0)
  }

  // Cambia la intensidad en vivo
  setIntensity(value) {
    this.intensityNode.value = value
  }

  turnOn() {
    this.setIntensity(this.maxIntensity)
  }

  turnOff() {
    this.setIntensity(0.0)
  }

  // Acepta hex, string o THREE.Color
  setColor(value) {
    this.colorUniform.value.set(value)
  }
}

export default LightMaterial;
