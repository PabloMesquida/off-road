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
    this.wheels.forEach(wheel => {
        wheel.mesh.rotation.z = Math.random() * Math.PI * 2 // 0 a 360 grados
        this.chassis.mesh.add(wheel.mesh);
    });

    this.controller = new VehicleController(this.chassis, this.wheels)
    this.visuals = new VehicleVisuals(this.chassis)
    this.chassis.mesh.position.set(0,10,0)
    this.scene.add(this.chassis.mesh)
  }
}

export default Vehicle
