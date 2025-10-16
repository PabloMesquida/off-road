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
    const radius = 0.35

    wheels.forEach((wheel) => {
      const pos = wheel.position
      this.controller.addWheel(
        new RAPIER.Vector3(pos.x, pos.y, pos.z),
        suspensionDir,
        axle,
        0.35, // 0.125
        radius
      )
    })

    wheels.forEach((_, i) => {
      // Tamaño de ruedas
      // wthis.controller.setWheelRadius(i, 0.4)

      

      this.controller.setWheelSuspensionRestLength(i, 0.7);
      this.controller.setWheelMaxSuspensionTravel(i, 0.6);
      this.controller.setWheelSuspensionStiffness(i, 65); // N/m aproximado 55
      this.controller.setWheelSuspensionCompression(i, 3.0); // 4
      this.controller.setWheelSuspensionRelaxation(i, 3.0); // 2
      this.controller.setWheelMaxSuspensionForce(i,20000); // 20000

      // Fricción
       this.controller.setWheelFrictionSlip(i, 8.0)           // tracción normal
  this.controller.setWheelSideFrictionStiffness(i, 1)  // agarre lateral medio
    })

    // parámetros de control
    this.accelerateForce = 25.0
    this.brakeForce = 0.05
    this.steerAngleMax = Math.PI / 6
  }

  update(dt) {
    if (!this.controller) return

    // motor/steering → a partir de inputs
    const fwd  = !!this.inputs.keys['forward']
    const back = !!this.inputs.keys['backward']
    const left = !!this.inputs.keys['left']
    const right= !!this.inputs.keys['right']

   // const engineForce = (Number(fwd) - Number(back)) * this.accelerateForce
/*     for (let i = 0; i < this.wheels.length; i++) {
      this.controller.setWheelEngineForce(i, engineForce)
    } */

        // === SUAVIZAR LA FUERZA DE MOTOR ===
        
    const targetForce = (Number(fwd) - Number(back)) * this.accelerateForce
    this.currentForce = this.currentForce ?? 0
    // Lerp hacia el objetivo con una constante de suavizado (ajustá 6–10)
  const smoothFactor =10  // más agresivo
this.currentForce = THREE.MathUtils.lerp(this.currentForce, targetForce, 1 - Math.exp(-smoothFactor * dt))
this.chassis.body.wakeUp()
     this.controller.setWheelEngineForce(2,  this.currentForce)
      this.controller.setWheelEngineForce(3,  this.currentForce)

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
