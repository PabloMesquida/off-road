import { TransformControls } from 'three/examples/jsm/Addons.js'
import * as THREE from 'three/webgpu'
import Game from '../Game'

export default class TransformControlsManager {
  constructor({ scene, cameraGetter, domElement, inputsEvents, onChangeKinematic }) {
    this.game = new Game()
    this.floor = this.game.world.floor
    this.scene = scene
    this.cameraGetter = cameraGetter
    this.domElement = domElement
    this.inputsEvents = inputsEvents
    this.onChangeKinematic = onChangeKinematic

    this.transform = null
    this.selectedAsset = null

    this.lastValidPosition = new THREE.Vector3() // Para guardar posición válida
    this.lastValidQuaternion = new THREE.Quaternion() // Para guardar rotación válida
  }

  create() {
    if (this.transform) return

    const camera = this.cameraGetter()
    this.transform = new TransformControls(camera, this.domElement)

    this.transform.showX = true
    this.transform.showY = false
    this.transform.showZ = true

    this.inputsEvents.on('translateMode', (isDown) => {
      if (isDown) {
        this.transform.setMode('translate')
        this.transform.showX = true
        this.transform.showY = false
        this.transform.showZ = true
      }
    })

    this.inputsEvents.on('rotateMode', (isDown) => {
      if (isDown) {
        this.transform.setMode('rotate')
        this.transform.showX = false
        this.transform.showY = true
        this.transform.showZ = false
      }
    })

    this.transform.setColors(0xFFFFFF50, 0xFFFFFF, 0xFFFFFF50, 0xffff00)
    this.transform.setSpace('world')
    this.transform.rotationSnap = THREE.MathUtils.degToRad(5)

    this.scene.add(this.transform.getHelper())

     this.transform.addEventListener('dragging-changed', (e) => {
      if (e.value) {
        // Comenzó el drag - guardar posición inicial
        if (this.selectedAsset) {
          this.lastValidPosition.copy(this.selectedAsset.position)
          this.lastValidQuaternion.copy(this.selectedAsset.quaternion)
        }
      } else {
        // Terminó el drag - verificar si está en zona prohibida
        if (this.selectedAsset && this.floor) {
          const position = this.selectedAsset.position
          if (this.floor.isInsideStartZone(position)) {
            // Revertir a la última posición válida
            this.selectedAsset.position.copy(this.lastValidPosition)
            this.selectedAsset.quaternion.copy(this.lastValidQuaternion)
            console.warn('No se puede colocar en la zona de inicio')
          }
        }
      }
      
      this.onChangeKinematic?.(e.value, this.selectedAsset)
    })

    this.transform.addEventListener('objectChange', () => {
      const group = this.selectedAsset
      if (!group) return
      
      // Verificar en tiempo real si está entrando en la startZone
      if (this.floor && this.floor.isInsideStartZone(group.position)) {
        // Si está en la zona prohibida, revertir inmediatamente
        group.position.copy(this.lastValidPosition)
        group.quaternion.copy(this.lastValidQuaternion)
        // this.transform.updateMatrixWorld() // Actualizar controles
        return // No procesar cambios físicos
      } else {
        // Actualizar última posición válida
        this.lastValidPosition.copy(group.position)
        this.lastValidQuaternion.copy(group.quaternion)
      }

      // Actualizar física solo si está fuera de la zona prohibida
      if (group.body && group.body.isKinematic && typeof group.body.isKinematic === 'function' ? group.body.isKinematic() : false) {
        group.body.setNextKinematicTranslation?.(group.position)
        group.body.setNextKinematicRotation?.(group.quaternion)
      }
    })
  }

  attach(object) {
    this.selectedAsset = object
    
    if (!this.transform) return
    
    this.transform.attach(object)

    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDimension = Math.max(size.x, size.y, size.z)

    const scaleFactor = Math.max(0.5, Math.min(maxDimension * 0.5, 5)) 
    this.transform.setSize(scaleFactor)
  }

  detach() {
    this.selectedAsset = null
    this.transform?.detach()
  }

  dispose() {
    if (!this.transform) return
    this.scene.remove(this.transform.getHelper())
    this.transform.dispose()
    this.transform = null
  } 
}
