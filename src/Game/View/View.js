import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import { OrbitControls  } from 'three/examples/jsm/controls/OrbitControls.js'
// import updateCameraOrbit from '../Utils/cameraMovement.js'

class View{
  constructor(){
    this.game = new Game()

    this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.sizes.width / this.game.viewport.sizes.height, 0.1, 1000)
    this.camera.position.set(0, 10, 0)

    this.game.world.scene.add(this.camera)

    this.controls = new OrbitControls(this.camera, this.game.domElement)
    this.controls.enableDamping = true
    this.controls.enabled = false 

    this.offset = new THREE.Vector3(20, 25, 20)
    this.lerpSpeed = 3.5

    // --- estado del modo edición ---
    this.isEditing = false
    this.editCamTarget = new THREE.Vector3(0, 0, 0)
    this.dragging = false
    this.prevMouse = new THREE.Vector2()
    this.panSpeed = 0.02
    this.zoomSpeed = 2.0

    // listeners de mouse
    const dom = this.game.domElement
    dom.addEventListener('mousedown', (e) => this.onMouseDown(e))
    dom.addEventListener('mousemove', (e) => this.onMouseMove(e))
    dom.addEventListener('mouseup', () => this.onMouseUp())
    dom.addEventListener('wheel', (e) => this.onWheel(e))

    this.game.viewport.events.on('change', () => { this.resize() })
  }

  resize(){
    this.camera.aspect = this.game.viewport.sizes.width / this.game.viewport.sizes.height
    this.camera.updateProjectionMatrix()
  }

  // ================================
  //   MODO EDICIÓN ON/OFF
  // ================================
  setEditMode(active) {
    this.isEditing = active
    console.log( this.isEditing)
    if (active) {
      // Guardar posición y dirección actuales
      this.savedFollowPos = this.camera.position.clone()
      this.savedLookAt = new THREE.Vector3()
      this.camera.getWorldDirection(this.savedLookAt)
      this.editCamTarget.copy(this.savedFollowPos.clone().addScaledVector(this.savedLookAt, 10))
    } else {
      // Al salir, animar de vuelta al seguimiento del vehículo
      this.animateBackToVehicle = true
      this.animationTime = 0
    }
  }

  // ================================
  //  EVENTOS DE MOUSE PARA MOVER
  // ================================
  onMouseDown(e) {
    if (!this.isEditing) return
    if (e.button === 0 || e.button === 1) {
      this.dragging = true
      this.prevMouse.set(e.clientX, e.clientY)
    }
  }

  onMouseMove(e) {
    if (!this.isEditing || !this.dragging) return

    const deltaX = e.clientX - this.prevMouse.x
    const deltaY = e.clientY - this.prevMouse.y
    this.prevMouse.set(e.clientX, e.clientY)

    // mover en plano XZ (pan)
    const moveX = -deltaX * this.panSpeed
    const moveZ = deltaY * this.panSpeed

    this.camera.position.x += moveX
    this.camera.position.z += moveZ
    this.editCamTarget.x += moveX
    this.editCamTarget.z += moveZ
  }

  onMouseUp() {
    this.dragging = false
  }

  onWheel(e) {
    if (!this.isEditing) return
    const delta = e.deltaY > 0 ? 1 : -1
    this.camera.position.y += delta * this.zoomSpeed
    // opcional: limitar altura
    this.camera.position.y = Math.max(5, Math.min(50, this.camera.position.y))
  }

 update(dt) {
  const vehicle = this.game.world.vehicle
  if (!vehicle || !vehicle.chassis) return

    const body = vehicle.chassis.body
    const pos = body.translation()
    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z)

    if (this.isEditing) {
      // En edición: cámara libre, no sigue al vehículo
      this.camera.lookAt(this.editCamTarget)
      return
    }

    // Si estaba animando de vuelta al vehículo:
    if (this.animateBackToVehicle) {
      this.animationTime += dt
      const t = Math.min(this.animationTime * 2, 1) // animación de ~0.5s

      // Seguridad: si savedFollowPos no existe, usar la posición actual
      const startPos = this.savedFollowPos || this.camera.position.clone()
      const desiredCamPos = carPos.clone().add(this.offset)

      // Si alguna de las posiciones es inválida, abortar animación
      if (!startPos || !desiredCamPos) {
        this.animateBackToVehicle = false
        return
      }

      // Interpolación suave entre la posición inicial y la deseada
      this.camera.position.lerpVectors(startPos, desiredCamPos, t)
      this.camera.lookAt(carPos.clone().add(new THREE.Vector3(0, 1.0, 0)))

      if (t >= 1) {
        this.animateBackToVehicle = false
      }
      return
    }

    const desiredCamPos = carPos.clone().add(this.offset);
    this.camera.position.lerp(desiredCamPos, 1 - Math.exp(-this.lerpSpeed * dt));

    const lookAtPos = carPos.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.camera.lookAt(lookAtPos);

  //   updateCameraOrbit(this, this.camera, this.controls, {
  //   minSpeed: 0.005,
  //   maxSpeed: 0.005,
  //   height: 10,
  //   targetY: 1
  // });


 // this.controls.update(dt)
}
}

export default View