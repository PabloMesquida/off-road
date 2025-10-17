import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class LightMaterial extends THREE.MeshPhysicalNodeMaterial {
  constructor({ color = 0xFFFFFF, intensity = 0, maxIntensity = 1 } = {}) {
    super()

    // Uniform que se puede actualizar dinámicamente
    this.intensityNode = TSL.uniform(TSL.float(intensity))
    this.maxIntensity = maxIntensity

    // Nodo de color base
    this.colorNode = TSL.color(color)

    // Nodo emisivo = color * intensidad
    this.emissiveNode = TSL.mul(this.colorNode, this.intensityNode)

    // Evita clamping
    this.toneMapped = false
    this.roughness = 0.0
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

  setColor(hex) {
    this.colorNode = TSL.color(hex)
    this.emissiveNode = TSL.mul(this.colorNode, this.intensityNode)
  }
}

export default LightMaterial;
