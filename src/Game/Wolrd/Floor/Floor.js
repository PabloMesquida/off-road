import * as THREE from 'three/webgpu'
import Game from '../../Game.js' 

class Floor{
  constructor(){
    this.game = new Game()

    this.floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshNormalMaterial()
    )
    this.floorMesh.rotation.x = -Math.PI / 2  

  const quat = new THREE.Quaternion()
  quat.setFromEuler(this.floorMesh.rotation)

    this.game.physics.addEntity({
      type: 'fixed',
      position: { x:0, y:0, z:0},
      rotation: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
      colliders: [ { shape: 'cuboid', parameters: [100, 0.1, 100] }]
    }, this.floorMesh) 
  }

}

export default Floor