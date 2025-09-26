import * as THREE from 'three/webgpu'
import Game from "../../Game.js"

class Chassis {
  constructor(position = {x:0,y:5,z:0}) {
    this.game = new Game()
    this.physics = this.game.physics
    this.sizes = { length: 4, height: 1, width: 2}

    this.rotation = { x:0 ,y:0, z: Math.PI / 32, w: 1 } 

    const geometry = new THREE.BoxGeometry(this.sizes.length, this.sizes.height, this.sizes.width)
    const material = new THREE.MeshBasicMaterial({color: 'orange', wireframe: true})
    this.mesh = new THREE.Mesh(geometry, material)

    this.entity = this.physics.addEntity({
      type: 'dynamic',
      position,
      rotation: this.rotation,
      mass: 10, 
      colliders: [{ shape: 'cuboid', parameters: [this.sizes.length * 0.5, this.sizes.height * 0.5, this.sizes.width * 0.5] }]
    }, this.mesh)
  }

  get body() {
    return this.entity.physical.body
  }
}

export default Chassis
