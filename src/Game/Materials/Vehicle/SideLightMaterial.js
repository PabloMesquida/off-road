import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class SideLightMaterial extends THREE.MeshPhysicalNodeMaterial {
  constructor({ _color = 0xFFFFFF, _intensity = 0 } = {}) {
    super();

    // Uniform que se puede actualizar dinámicamente
    this.intensityNode = TSL.uniform(TSL.float(_intensity));

    // Nodo de color base
    this.colorNode = TSL.color(_color);

    // Nodo emisivo = color * intensidad
    this.emissiveNode = TSL.mul(this.colorNode, this.intensityNode);

    // Evita clamping
    this.toneMapped = false;
    this.roughness = 0.0
    // this.turnOn()
  }

  // Cambia la intensidad en vivo
  setIntensity(value) {
    this.intensityNode.value = value;
  }

  turnOn() {
    this.setIntensity(10.0);
  }

  turnOff() {
    this.setIntensity(0.0);
  }


  setColor(hex) {
    this.colorNode = TSL.color(hex);
    // Actualiza el nodo emisivo con el nuevo color
    this.emissiveNode = TSL.mul(this.colorNode, this.intensityNode);
  }
}

export default SideLightMaterial;
