import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from '../../Game.js'

class VehicleController {
  constructor(chassis, wheels) {
    this.game = new Game()
    this.physics = this.game.physics
    this.inputs = this.game.inputs  

    this.chassis = chassis
    this.wheels = wheels

    this.controller = this.physics.world.createVehicleController(chassis.body)

    // parámetros de rueda
    const suspensionDir = new RAPIER.Vector3(0, -1, 0)
    const axle = new RAPIER.Vector3(0, 0, -1)
    const radius = 0.5

    wheels.forEach((wheel) => {
      const pos = wheel.position
      this.controller.addWheel(
        new RAPIER.Vector3(pos.x, pos.y, pos.z),
        suspensionDir,
        axle,
        0.6, // 0.125
        radius
      )
    })



    wheels.forEach((_, i) => {
      // Tamaño de ruedas
      // wthis.controller.setWheelRadius(i, 0.4)

      // Suspensión
      this.controller.setWheelSuspensionRestLength(i, 0.6)
      this.controller.setWheelMaxSuspensionTravel(i, 0.6) // 1
      this.controller.setWheelSuspensionStiffness(i, 50) // 24 // 15
      this.controller.setWheelSuspensionCompression(i, 4.0)
      this.controller.setWheelSuspensionRelaxation(i, 2.0)
      this.controller.setWheelMaxSuspensionForce(i, 20000) // 5000

      // Fricción
      this.controller.setWheelFrictionSlip(i, 5.0)           // tracción normal
      this.controller.setWheelSideFrictionStiffness(i, 2.0)  // agarre lateral medio
    })

    // parámetros de control
    this.accelerateForce = 4.0
    this.brakeForce = 0.05
    this.steerAngleMax = Math.PI / 8 
  }

  update(dt) {
    if (!this.controller) return

    // motor/steering → a partir de inputs
    const fwd  = !!this.inputs.keys['forward']
    const back = !!this.inputs.keys['backward']
    const left = !!this.inputs.keys['left']
    const right= !!this.inputs.keys['right']

    const engineForce = (Number(fwd) - Number(back)) * this.accelerateForce
    for (let i = 0; i < this.wheels.length; i++) {
      this.controller.setWheelEngineForce(i, engineForce)
    }

    const steerDir = Number(left) - Number(right)
    const currentSteer = this.controller.wheelSteering(0) || 0
    const targetSteer = this.steerAngleMax * steerDir
    const smoothSteer = THREE.MathUtils.lerp(currentSteer, targetSteer, 0.1)
    this.controller.setWheelSteering(0, smoothSteer)
    this.controller.setWheelSteering(1, smoothSteer)

    // avanzar la simulación del vehículo
    this.controller.updateVehicle(dt)
  }

  syncMeshes() {
    // chasis
    const t = this.chassis.body.translation()
    const r = this.chassis.body.rotation()
    this.chassis.mesh.position.copy(new THREE.Vector3(t.x, t.y, t.z))
    this.chassis.mesh.quaternion.copy(new THREE.Quaternion(r.x, r.y, r.z, r.w))

    // ruedas
    this.wheels.forEach((wheel, i) => {
      wheel.update(this.controller, i)
    })
  }

}

export default VehicleController
