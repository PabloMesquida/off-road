import * as THREE from 'three/webgpu'
import { Pane } from 'tweakpane'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import AssetManager from './Assets/AssetManager.js'

class World {
  constructor() {
    this.game = new Game()
    this.scene = new THREE.Scene()
    this.events = new Events()

    this.resources = this.game.resources
    this.floor = new Floor(this.scene, this.game.physics, { x: 160, y: 0.2, z: 160 })

    this.isEditing = false
    this.initialVehiclePosition = new THREE.Vector3(0, 2, 0) 
    this.initialVehicleRotation = new THREE.Quaternion()

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.isPlacingCone = false
    this.placingButton = null

    this.domElement = this.game.domElement
    this.camera = null
    // Tweakpane
    this.initTweakpane()

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene, this.game.physics)
      if (this.vehicle && this.vehicle.chassis && this.vehicle.chassis.mesh) {
   
        this.initialVehicleRotation.copy(this.vehicle.chassis.mesh.quaternion)
      }
      this.environment = new Environment(this.scene)
      this.cones = new AssetManager(this.scene, { resourcePathName: "coneModel" })
        
    })

    this.findCameraAttempted = false
  }


  initTweakpane() {
  try {
    this.pane = new Pane();

    // --- [ EDIT MODE toggle ] ---
    this.editParam = { editMode: false };
    this.pane.addBinding(this.editParam, 'editMode', { label: 'EDIT MODE' })
      .on('change', (ev) => {
        this.toggleEditMode(ev.value);
      });

    // --- [ CONE placing button ] ---
    this.placingButton = this.pane.addButton({ title: 'Cono' });
    this.placingButton.on('click', () => this.togglePlacingCone());

    // --- [ Dynamic text blade for "Placing" status ] ---
    this.placingBlade = this.pane.addBlade({
      view: 'text',
      label: 'Placing',
      parse: (v) => v,
      value: 'OFF', // valor inicial
    });

  } catch (e) {
    console.warn('[World] Tweakpane no está disponible o falló la inicialización:', e);
  }
}


  toggleEditMode(isEditing) {
    this.isEditing = isEditing

    if (isEditing) {
      console.log('🧰 Edit mode ON')
      
      // guardar posición inicial del vehículo

     
      // resetear vehículo a la posición original
      if (this.vehicle && this.vehicle.chassis && this.vehicle.chassis.body) {
        const pos = this.initialVehiclePosition
        const rot = this.initialVehicleRotation
        this.vehicle.chassis.body.setTranslation( this.initialVehiclePosition , true)
        this.vehicle.chassis.body.setRotation(rot, true)
        this.vehicle.chassis.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        this.vehicle.chassis.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }

      // desactivar control del vehículo
      if (this.game.inputs) {
        this.game.inputs.enabled = false
      }

      // activar tweakpane u otras herramientas
      this.pane.hidden = false

    } else {
      console.log('🕹️ Edit mode OFF')

      // reactivar controles
      if (this.game.inputs) {
        this.game.inputs.enabled = true
      }

      // cerrar o minimizar tweakpane si quieres
      // this.pane.hidden = true
    }
  }

  togglePlacingCone() {
    if (!this.cones) {
      this.isPlacingCone = !this.isPlacingCone
    } else {
      this.isPlacingCone = !this.isPlacingCone
      if (this.isPlacingCone) this.enablePlacing()
      else this.disablePlacing()
    }

     if (this.placingBlade) {
    this.placingBlade.value = this.isPlacingCone ? 'ON' : 'OFF';
  }
  }

  enablePlacing() {
    if (this.cones) this.cones.createPreview()
    this.domElement.addEventListener('pointermove', this.onPointerMove)
    this.domElement.addEventListener('pointerdown', this.onPointerDown)
  }

  disablePlacing() {
    if (this.cones) this.cones.disposePreview()
    this.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.domElement.removeEventListener('pointerdown', this.onPointerDown)
  }

  onPointerMove = (e) => {
   
    const camera =  this.game.view.camera
    if (!camera) return

    const rect = (this.domElement && this.domElement.getBoundingClientRect)
      ? this.domElement.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }

    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, camera)

    let floorMesh =  this.floor?.mesh || null; 

    let intersects = floorMesh
      ? this.raycaster.intersectObject(floorMesh, true)
      : this.raycaster.intersectObjects(this.scene.children, true).filter(it => it.face && Math.abs(it.face.normal.y) > 0.6)

    const hit = intersects.length ? intersects[0] : null
    const yOffset = 0.1

    if (hit) {
      const pos = { x: hit.point.x, y: hit.point.y + yOffset, z: hit.point.z }
      this.cones?.updatePreviewPosition(pos)
    } else {
      this.cones?.updatePreviewPosition(null)
    }
  }

  onPointerDown = (e) => {
    if (e.button !== 0 || !this.isPlacingCone) return
 
    const camera =  this.game.view.camera
    if (!camera) return

    const rect = (this.domElement && this.domElement.getBoundingClientRect)
      ? this.domElement.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }

    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, camera)

    let floorMesh =  this.floor?.mesh || null; 

    let intersects = floorMesh
      ? this.raycaster.intersectObject(floorMesh, true)
      : this.raycaster.intersectObjects(this.scene.children, true).filter(it => it.face && Math.abs(it.face.normal.y) > 0.6)

    const hit = intersects.length ? intersects[0] : null
    if (hit && this.cones?.spawn) {
      const yOffset = 0.5
      const spawnPos = { x: hit.point.x, y: hit.point.y + yOffset, z: hit.point.z }
      this.cones.spawn(spawnPos)
    }
  }

  update() {
    if (!this.vehicle) return
    const pos = this.vehicle.chassis.mesh.position
    const limit = this.floor.getLimit()
    const vel = this.vehicle.chassis.body.linvel()

    const isOutsideX = Math.abs(pos.x) > limit
    const isOutsideZ = Math.abs(pos.z) > limit

    const dirX = Math.sign(pos.x)
    const dirZ = Math.sign(pos.z)

    const movingOutwardX = Math.sign(vel.x) === dirX && isOutsideX
    const movingOutwardZ = Math.sign(vel.z) === dirZ && isOutsideZ
    const shouldBrake = movingOutwardX || movingOutwardZ

    this.vehicle.controller.isOutsideLimit = shouldBrake
    this.vehicle.visuals.isOutsideLimit = shouldBrake

    if (this.isPlacingCone && this.cones?.preview) {
      if (!this.cones.preview.group.visible) {
        const cam = this.findCamera()
        if (cam) {
          const forward = new THREE.Vector3(0, -0.2, -1).applyQuaternion(cam.quaternion)
          const pos = cam.position.clone().add(forward.multiplyScalar(3))
          this.cones.updatePreviewPosition({ x: pos.x, y: pos.y, z: pos.z })
        }
      }
    }
  }
}

export default World
