import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
import { wood } from "tsl-textures";

class WoodMaterial extends THREE.MeshStandardNodeMaterial {
  constructor() {    
    super();

    this.roughnessNode = TSL.float(1)
 
    this.colorNode = wood ( {
        scale: 2,
        rings: 2,
        lengths: 2.5,
        angle: 0,
        fibers: 0.15,
        fibersDensity: 10,
        color: new THREE.Color(0x73400d),
        background: new THREE.Color(0x542111),
        seed: 0
      });
  }
}

export default WoodMaterial
