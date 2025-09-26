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
        0.4, // 0.125
        radius
      )
    })

    wheels.forEach((_, i) => {
      this.controller.setWheelSuspensionStiffness(i, 15)
      this.controller.setWheelMaxSuspensionTravel(i, 1.5)
    })

    // parámetros de control
    this.accelerateForce = 5.0
    this.brakeForce = 0.05
    this.steerAngleMax = Math.PI / 8 //24


    this.game.time.events.on('tick', () => this.update())
  }

  update() {
  if (!this.controller) return

  const rawDelta = this.game.time.delta
  const dt = rawDelta > 1 ? rawDelta * 0.002 : rawDelta

  const fwd  = !!this.inputs.keys['forward']
  const back = !!this.inputs.keys['backward']
  const left = !!this.inputs.keys['left']
  const right= !!this.inputs.keys['right']
  const coerced = Number(fwd) - Number(back)
  const engineForce = coerced * this.accelerateForce

  // --- SET FORCES BEFORE calling updateVehicle ---
  for (let i = 0; i < this.wheels.length; i++) {
    const testValue = engineForce === 0 ? 0 : engineForce
    // console.log('SET: index', i, 'testValue', testValue)
    this.controller.setWheelEngineForce(i, testValue)
  }

  // steering
  const steerDir = Number(left) - Number(right)
  const current = this.controller.wheelSteering(0) || 0
  const target = this.steerAngleMax * steerDir

  const steering = THREE.MathUtils.lerp(current, target, 0.01)
  console.log(current, target, steering)
  this.controller.setWheelSteering(0, steering)
  this.controller.setWheelSteering(1, steering)

  // ahora avanzamos la simulación del vehicle
  this.controller.updateVehicle(dt)

  // actualizar ruedas visuales
  this.wheels.forEach((wheel, i) => wheel.update(this.controller, i))
}

}

export default VehicleController
