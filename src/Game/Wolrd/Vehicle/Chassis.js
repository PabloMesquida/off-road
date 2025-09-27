import * as THREE from 'three/webgpu'
import Game from "../../Game.js"

class Chassis {
  constructor(position = {x:0,y:10,z:0}) {
    this.game = new Game()
    this.physics = this.game.physics
    this.sizes = { length: 4, height: 2, width: 2}

    this.rotation = { x:0 ,y:0, z: Math.PI / 32, w: 1 } 

    const geometry = new THREE.BoxGeometry(this.sizes.length, this.sizes.height, this.sizes.width)
    const material = new THREE.MeshBasicMaterial({color: 'orange', wireframe: true})
    this.mesh = new THREE.Mesh(geometry, material)

    this.entity = this.physics.addEntity({
      type: 'dynamic',
      position,
      rotation: this.rotation,
    /*   massProperties: {
        useAdditionalMassProperties: true,
        massValue: 120,
        com: { x: 0, y: 0, z: 0 },   // baja el COM 0.25m
        principalInertia: { x: 2, y: 2, z: 2 },
        inertiaFrame: { w: 1, x: 0, y: 0, z: 0 },
        collidersContribute: false       // evita que los colliders sumen masa
      }, */
      colliders: [
        { shape: 'cuboid', parameters: [this.sizes.length * 0.5, this.sizes.height * 0.5, this.sizes.width * 0.5],
          offset: { x: 0, y: 0, z: 0 }, friction: 0.8 }
      ]
    }, this.mesh)
  }

  get body() {
    return this.entity.physical.body
  }
}

export default Chassis
