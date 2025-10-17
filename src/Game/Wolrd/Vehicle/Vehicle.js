import Chassis from './Chassis.js'
import Wheel from './Wheel.js'
import VehicleController from './VehicleController.js'
import VehicleVisuals from './VehicleVisuals.js'

class Vehicle {
  constructor(scene) {
    this.chassis = new Chassis()
    this.scene = scene

     this.wheels = [
      new Wheel({ x:-1.7, y:-0.1, z:-0.8 }),
      new Wheel({ x:-1.7, y:-0.1, z: 0.8 }),
      new Wheel({ x: 1.15, y:-0.15, z:-0.8 }),
      new Wheel({ x: 1.15, y:-0.15, z: 0.8 }),
    ]
    this.wheels.forEach(w => this.chassis.mesh.add(w.mesh))

    this.controller = new VehicleController(this.chassis, this.wheels)
    this.visuals = new VehicleVisuals(this.chassis)
    this.scene.add(this.chassis.mesh)
  }
}

export default Vehicle
