import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';

class PaintMaterial extends THREE.MeshStandardNodeMaterial {
  constructor({ baseColor = 0xff0000, rough = 0.7, metal = 0.5 } = {}) {    
    super();

    this.colorNode = TSL.color(baseColor)
    this.roughnessNode = TSL.float(rough)
    this.metalnessNode = TSL.float(metal)
    this.side = 2
   // this.aoNode = TSL.float(1)
  }
}

export default PaintMaterial
