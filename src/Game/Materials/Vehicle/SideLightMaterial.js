import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class SideLightMaterial extends THREE.MeshPhysicalNodeMaterial {
  constructor({ color = 0xba4e06, intensity = 0.0 } = {}) {
    super();

    // Color base (apenas visible si apagado)
    this.colorNode = TSL.color(color);

    // Emission para efecto prendido
    this.emissiveNode = TSL.color(color);
    this.emissiveIntensity = intensity;

    // Opcional: más brillante con roughness bajo
    this.roughnessNode = TSL.float(1.0);
    this.metalnessNode = TSL.float(0.0);
  }

  turnOn() {
    this.emissiveIntensity = 1.0;
  }

  turnOff() {
    this.emissiveIntensity = 0.0;
  }

  setColor(hex) {
    this.emissiveNode = TSL.color(hex);
  }
}

export default SideLightMaterial