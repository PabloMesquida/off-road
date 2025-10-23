import * as THREE from 'three/webgpu'
import PolishedConcreteMaterial from '../../Materials/PolishedConcreteMaterial'

class CubeTest{
  constructor(scene){
    this.scene = scene

    this.box = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 32),
      new THREE.MeshStandardMaterial({color: 'white', roughness: 1})
    )
    this.box.position.set(0,1,5)
     this.box.castShadow = true;
     this.box.receiveShadow = true;
    this.scene.add(this.box)
  }
}

export default CubeTest
