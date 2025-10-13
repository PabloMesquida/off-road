import * as THREE from 'three/webgpu'
import Game from '../../Game'

class Wheel {
  constructor(position) {
    this.position = position

    this.game = new Game()
    this.resources = this.game.resources
    
    this.resource = this.resources.items.wheelModel.scene

    this.mesh = new THREE.Group()
    this.inner = new THREE.Group()

    this.model = this.resource.clone()

     // ✅ rotar el modelo según el lado del coche
    if (this.position.z <= 0) { 
      // Lado derecho → girar la rueda
      this.model.rotation.y = -Math.PI
    }

    this.inner.add(this.model)
    this.mesh.add(this.inner)

    this.mesh.position.copy(position)
  }

  update(controller, index) {
    const up = new THREE.Vector3(0, 1, 0)

    const suspension = controller.wheelSuspensionLength(index) ?? 0
    const conn = controller.wheelChassisConnectionPointCs(index) ?? { y: 0 }
    const steering = controller.wheelSteering(index) ?? 0
    const rotation = controller.wheelRotation(index) ?? 0
    const axle =   controller.wheelAxleCs(index)
    const axleVec = new THREE.Vector3(axle.x, axle.y, axle.z)

    // ajustar altura
    this.mesh.position.y = conn.y - suspension

    // calcular rotación
    const qSteer = new THREE.Quaternion().setFromAxisAngle(up, steering)
    const qRot = new THREE.Quaternion().setFromAxisAngle(axleVec, rotation)
    this.mesh.quaternion.copy(qSteer).multiply(qRot)
  }
}

export default Wheel
