import * as THREE from 'three/webgpu'

class Wheel {
  constructor(position, radius = 0.5, width = 0.5
  ) {
    this.position = position
    this.radius = radius
    this.width = width

    this.mesh = this.createMesh()
    this.mesh.position.copy(position)
 
  }

  createMesh() {
    const outer = new THREE.Group()
    const inner = new THREE.Group()
    inner.rotation.x = -Math.PI / 2 

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.width, 8),
      new THREE.MeshBasicMaterial({ color: 'red', wireframe: true })
    )

    inner.add(tire)
    outer.add(inner)
    return outer
  }

  update(controller, index) {
    const up = new THREE.Vector3(0, 1, 0)

    const suspension = controller.wheelSuspensionLength(index) ?? 0
    const conn = controller.wheelChassisConnectionPointCs(index) ?? { y: 0 }
    const steering = controller.wheelSteering(index) ?? 0
    const rotation = controller.wheelRotation(index) ?? 0
    const axle = controller.wheelAxleCs(index)
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
