import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import Cone from './Assets/Cone/Cone.js'

class World{
  constructor(){
    this.game = new Game()
    this.scene = new THREE.Scene()
    this.events = new Events()
  
    this.resources = this.game.resources
  
    this.floor = new Floor(this.scene, this.game.physics, { x: 160 , y: 0.2, z: 160}) 

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene, this.game.physics)
      this.environment = new Environment(this.scene)
      this.cone = new Cone(this.scene)
    })



   }

  update() {
    if (!this.vehicle) return

    const pos = this.vehicle.chassis.mesh.position
    const limit = this.floor.getLimit()

    const vel = this.vehicle.chassis.body.linvel()

    const isOutsideX = Math.abs(pos.x) > limit
    const isOutsideZ = Math.abs(pos.z) > limit

    const dirX = Math.sign(pos.x)
    const dirZ = Math.sign(pos.z)

    // Movimiento hacia afuera (si la velocidad tiene el mismo signo que la posición)
    const movingOutwardX = Math.sign(vel.x) === dirX && isOutsideX
    const movingOutwardZ = Math.sign(vel.z) === dirZ && isOutsideZ

    // El freno solo se activa si está fuera y moviéndose hacia afuera en alguno de los ejes
    const shouldBrake = movingOutwardX || movingOutwardZ

    // Actualiza el flags
    this.vehicle.controller.isOutsideLimit = shouldBrake
    this.vehicle.visuals.isOutsideLimit = shouldBrake
  }

}

export default World