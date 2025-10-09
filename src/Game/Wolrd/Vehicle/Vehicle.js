import Chassis from './Chassis.js'
import Wheel from './Wheel.js'
import VehicleController from './VehicleController.js'

class Vehicle {
  constructor(scene) {
    this.chassis = new Chassis()
    this.scene = scene

     this.wheels = [
      new Wheel({ x:-1.75, y:-0.5, z:-1 }),
      new Wheel({ x:-1.75, y:-0.5, z: 1 }),
      new Wheel({ x: 1.2, y:-0.5, z:-1 }),
      new Wheel({ x: 1.2, y:-0.5, z: 1 }),
    ]
    this.wheels.forEach(w => this.chassis.mesh.add(w.mesh))

    this.controller = new VehicleController(this.chassis, this.wheels)
    this.scene.add(this.chassis.mesh)
  }
}

export default Vehicle
