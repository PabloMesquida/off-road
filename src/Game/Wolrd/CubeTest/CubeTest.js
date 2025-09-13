import * as THREE from 'three/webgpu'
import Game from "../../Game.js"

class CubeTest{
  constructor(){
    this.game = new Game()

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    )
    this.box.visible = true

    this.game.physics.addEntity({
      type: 'dynamic',
      position: { x:0, y:4, z:0}, 
      rotation: { x: 0, y: 0, z: 0, w: 0 },
      colliders: [ { shape: 'cuboid', parameters: [0.5, 0.5, 0.5] }]
      }, 
      this.box)
  }
}

export default CubeTest