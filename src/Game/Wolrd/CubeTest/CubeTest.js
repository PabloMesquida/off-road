import * as THREE from 'three/webgpu'
import Game from "../../Game.js"

class CubeTest{
  constructor(){
    this.game = new Game()

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({color: 'orange', wireframe: true})
    )
    this.box.visible = false

    this.game.physics.addEntity({
      type: 'dynamic',
      position: { x:0, y:5, z:0},
      colliders: [ { shape: 'cuboid', parameters: [0.5, 0.5, 0.5] }]
      }, 
      this.box) 
  }
}

export default CubeTest
