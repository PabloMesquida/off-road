import * as THREE from 'three/webgpu'
import Game from '../../Game'
import MetalMaterial from '../../Materials/Vehicle/MetalMaterial.js'
import PaintMaterial from '../../Materials/Vehicle/PaintMaterial.js'

class Wheel {
  constructor(position) {
    this.position = position

    this.game = new Game()
    this.resources = this.game.resources
    
    this.resource = this.resources.items.wheelModel.scene

    this.mesh = new THREE.Group()
    this.inner = new THREE.Group()

    this.model = this.resource.clone()
    this.model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true

    })

    this.materials = {
      metal: new MetalMaterial({ baseColor: 0xb0b0b0, rough: 0.4, metal: 0.5 }),
      tire: new PaintMaterial({ baseColor: 0x181818, rough: 0.8, metal: 0 }),
      tireAccent: new PaintMaterial({ baseColor: 0xE7D6C9, rough: 0.8, metal: 0 })
    }
 

     //  rotar el modelo según el lado del coche
    if (this.position.z <= 0) { 
      // Lado derecho → girar la rueda
      this.model.rotation.y = -Math.PI
    }

    this.inner.add(this.model)
    this.mesh.add(this.inner)

    this.applyMaterials()

    this.mesh.position.copy(position)
    this.initialZOffset = Math.random() * Math.PI * 2;
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
    const qOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.initialZOffset);
    this.mesh.quaternion.copy(qSteer).multiply(qRot).multiply(qOffset);

  }

  applyMaterials() {
    this.model.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true

      const {  metal, tire, tireAccent } = this.materials

      if (child.name.includes('metal')) child.material = metal
      else if (child.name.includes('GomaNegra')) child.material = tire
      else if (child.name.includes('GomaBlanca')) child.material = tireAccent
    })
  }
}

export default Wheel
