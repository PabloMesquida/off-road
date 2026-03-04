import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class FloorMaterial extends THREE.MeshStandardNodeMaterial {
  constructor({ color = 0xff0000, rough = 1, metal = 0 } = {}) {    
    super();

    this.colorNode = TSL.color(color)
    this.roughnessNode = TSL.float(rough)
    this.metalnessNode = TSL.float(metal)
  }
}

export default FloorMaterial