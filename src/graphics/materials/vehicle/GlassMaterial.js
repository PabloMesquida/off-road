import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class GlassMaterial extends THREE.MeshPhysicalNodeMaterial {
  constructor({ baseColor = 0xFFFFFF, rough = 0.7, transmission = 0.9, metal = 0 } = {}) {
    super()

    this.colorNode = TSL.color(baseColor)
    this.roughnessNode = TSL.float(rough)
    this.transmissionNode = TSL.float(transmission)
    this.metalnessNode = TSL.float(metal)
  }
}

export default GlassMaterial;
