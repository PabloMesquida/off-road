import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import AssetManager from './Assets/AssetManager.js'
import { TransformControls } from 'three/examples/jsm/Addons.js'

class World {
  constructor() {
    this.game = new Game()
    this.inputs = this.game.inputs
    this.scene = new THREE.Scene()
    this.events = new Events()

    this.resources = this.game.resources
    this.floor = new Floor(this.scene, this.game.physics, { x: 160, y: 0.2, z: 160 })

    this.initialVehiclePosition = new THREE.Vector3(0, 2, 0)
    this.initialVehicleRotation = new THREE.Quaternion()

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.isPlacingCone = false
    this.placingButton = null

    this.selectedCone = null
    this.hoveredCone = null
    this.transformControls = null

    this.domElement = this.game.domElement
    this.camera = null

    // tweakpane
    this.initTweakpane()

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene, this.game.physics)
      if (this.vehicle?.chassis?.mesh) {
        this.initialVehicleRotation.copy(this.vehicle.chassis.mesh.quaternion)
      }
      this.environment = new Environment(this.scene)
      this.cones = new AssetManager(this.scene, { resourcePathName: "coneModel" })
    })

    this.isEditing = false
    this.toggleEditMode(this.isEditing)
  }

  /* ─────────────────────────────────────────────
   * Tweakpane
   * ───────────────────────────────────────────── */
  initTweakpane() {
    try {
      this.pane = this.game.pane
      this.assetsfolder = this.pane.addFolder({ title: 'Assets', expanded: false })
      this.editParam = { editMode: false }

      this.pane.addBinding(this.editParam, 'editMode', { label: 'EDIT MODE' })
        .on('change', ev => this.toggleEditMode(ev.value))

      this.placingButton = this.assetsfolder.addButton({ title: 'Cone' })
      this.placingButton.on('click', () => this.togglePlacingCone())

      this.updateTweakpaneState(false)
    } catch (e) {
      console.warn('[World] Tweakpane no disponible:', e)
    }
  }

  updateTweakpaneState(isEditing) {
    const el = this.assetsfolder?.element
    if (el) {
      el.style.opacity = isEditing ? '1' : '0.5'
      el.style.pointerEvents = isEditing ? 'auto' : 'none'
    }
  }

  /* ─────────────────────────────────────────────
   * Edit Mode Toggle
   * ───────────────────────────────────────────── */
  toggleEditMode(isEditing) {
    this.isEditing = isEditing
    this.updateTweakpaneState(isEditing)


    // Actualizar estado de edición en el piso
    if (this.floor?.setEditableState)
      this.floor.setEditableState(isEditing)

    if (isEditing) {
      console.log('Edit mode ON')

      // Resetear vehículo a posición inicial
      if (this.vehicle?.chassis?.body) {
        const body = this.vehicle.chassis.body
        body.setTranslation(this.initialVehiclePosition, true)
        body.setRotation(this.initialVehicleRotation, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }

      // Crear transform controls si no existen
      if (!this.transformControls) {
        const camera = this.game.view.camera
        const domElement = this.game.domElement
        this.transformControls = new TransformControls(camera, domElement)

        this.transformControls.showX = true
        this.transformControls.showY = false 
        this.transformControls.showZ = true 

        this.inputs.events.on('translateMode', (isDown) => {
          if (isDown) {
            this.transformControls.setMode('translate')
            this.transformControls.showX = true
            this.transformControls.showY = false 
            this.transformControls.showZ = true 
          }
        })

        this.inputs.events.on('rotateMode', (isDown) => {
          if (isDown) {
            this.transformControls.setMode('rotate')
            this.transformControls.showX = false 
            this.transformControls.showY = true 
            this.transformControls.showZ = false 
          }
        })

        // Personalización visual
        this.transformControls.setColors(
          0xFFFFFF50,  // X
          0xFFFFFF,  // Y
          0xFFFFFF50,  // Z
          0xffff00   // activo
        )

        this.transformControls.setSpace('world') // trabaja en coordenadas globales
        this.transformControls.rotationSnap = THREE.MathUtils.degToRad(5) // pasos de 5º

        this.scene.add(this.transformControls.getHelper())

        // Cuando se arrastra un objeto
        this.transformControls.addEventListener('dragging-changed', (e) => {
          const coneData = this.cones.instances.find(c => c.group === this.selectedCone)
          if (!coneData?.body) return

          if (e.value) {
            // Empieza a mover → hacerlo kinematic y pausar la física de ese cuerpo
            coneData.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
       
          } else {
            // Soltó → volverlo dinámico para que vuelva a comportarse físicamente
            coneData.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
          
          }
          // if (isEditing) {
          //   console.log('true', isEditing)
          //   this.setEditPhysics(true)
          // } else {
          //   console.log('false', isEditing)
          //   this.setEditPhysics(false)
          // }
        })

        this.transformControls.addEventListener('objectChange', () => {
          const coneData = this.cones.instances.find(c => c.group === this.selectedCone)
          if (coneData?.body) {
            const pos = coneData.group.position
            const rot = coneData.group.quaternion
            coneData.body.setNextKinematicTranslation(pos)
            coneData.body.setNextKinematicRotation(rot)
          }
        })
      }

      // Activar listeners de escena solo en modo edición
      this.domElement.addEventListener('pointermove', this.onPointerHoverAsset);
      this.domElement.addEventListener('pointerdown', this.onPointerSelectAsset);

    } else {
      console.log('Edit mode OFF');

      // Desactivar colocación de conos si estaba activa
      if (this.isPlacingCone) {
        this.isPlacingCone = false;
        this.disablePlacing();
      }

      // Eliminar transform controls
      if (this.transformControls) {
        this.scene.remove(this.transformControls.getHelper());
        this.transformControls.dispose();
        this.transformControls = null;
      }

      // Limpiar selección
      this.highlightAsset(this.selectedCone, false);
      this.selectedCone = null;
      this.hoveredCone = null;

      // Quitar listeners de escena
      this.domElement.removeEventListener('pointermove', this.onPointerHoverAsset);
      this.domElement.removeEventListener('pointerdown', this.onPointerSelectAsset);
      this.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }



  }


  /* ─────────────────────────────────────────────
   * Placing Mode
   * ───────────────────────────────────────────── */
  togglePlacingCone() {
    if (!this.isEditing) {
      console.warn('No puedes colocar conos fuera del modo edición.')
      return
    }

    this.isPlacingCone = !this.isPlacingCone
    if (this.isPlacingCone) this.enablePlacing()
    else this.disablePlacing()
  }

  enablePlacing() {
    if (!this.isEditing) return
    this.cones?.createPreview()
    this.domElement.addEventListener('pointermove', this.onPointerMove)
    this.domElement.addEventListener('pointerdown', this.onPointerDown)
  }

  disablePlacing() {
    this.cones?.disposePreview()
    this.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.isPlacingCone = false
  }

  /* ─────────────────────────────────────────────
   * Hover y Selección de Conos
   * ───────────────────────────────────────────── */
  findConeGroup(object) {
    if (!this.cones?.instances) return null
    let node = object
 
    while (node) {
      const found = this.cones.instances.find(c => c.group === node)
      if (found) return node
      node = node.parent
    }
    return null
  }

  highlightAsset(group, highlight = true) {
    if (!group) return
    group.traverse(c => {
      if (c.isMesh) {
        if (highlight) {
          if (!c.userData.originalMaterial) {
            c.userData.originalMaterial = c.material
            c.material = c.material.clone()
          }
          c.material.emissive?.setHex(0x333333)
        } else {
          if (c.userData.originalMaterial) {
            c.material.dispose()
            c.material = c.userData.originalMaterial
            delete c.userData.originalMaterial
          }
        }
      }
    })
  }

  onPointerHoverAsset = (e) => {
    if (!this.isEditing || this.isPlacingCone) return
    if (this.transformControls?.dragging) return

    const camera = this.game.view.camera
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
  
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, camera)

    const validCones = (this.cones?.instances || []).map(c => c.group)
    const intersects = this.raycaster.intersectObjects(validCones, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const coneGroup = this.findConeGroup(hit.object)
      if (coneGroup && coneGroup !== this.hoveredCone) {
        this.highlightAsset(this.hoveredCone, false)
        this.hoveredCone = coneGroup
        this.highlightAsset(this.hoveredCone, true)
        this.domElement.style.cursor = 'pointer'
      }
    } else {
      this.highlightAsset(this.hoveredCone, false)
      this.hoveredCone = null
      this.domElement.style.cursor = 'default'
    }
  }

  onPointerSelectAsset = (e) => {
    if (!this.isEditing || this.isPlacingCone) return
    if (e.button !== 0) return
    if (this.transformControls?.dragging) return

    const camera = this.game.view.camera
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const validCones = (this.cones?.instances || []).map(c => c.group)
    const intersects = this.raycaster.intersectObjects(validCones, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const coneGroup = this.findConeGroup(hit.object)
      if (coneGroup) {
        if (this.selectedCone !== coneGroup) {
          this.highlightAsset(this.selectedCone, false)
          this.selectedCone = coneGroup
          this.highlightAsset(this.selectedCone, true)
          this.transformControls.attach(this.selectedCone)

          // --- Ajustar tamaño del gizmo según el objeto ---
          const box = new THREE.Box3().setFromObject(this.selectedCone)
          const size = new THREE.Vector3()
          box.getSize(size)
          
          const maxSize = Math.max(size.x * 0.5, size.y * 0.5, size.z * 0.5)
          const offset = 0.05 
          this.transformControls.setSize(maxSize + offset)
        }
      }
    } else {
      // clic fuera: deseleccionar
      this.highlightAsset(this.selectedCone, false)
      this.selectedCone = null
      this.transformControls.detach()
    }
  }

  /* ─────────────────────────────────────────────
   * Colocación de conos
   * ───────────────────────────────────────────── */
  onPointerMove = (e) => {
    const camera = this.game.view.camera
    if (!camera) return
    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const floorMesh = this.floor?.mesh
    const intersects = floorMesh
      ? this.raycaster.intersectObject(floorMesh, true)
      : []
    const hit = intersects[0]
    if (hit) {
      const pos = { x: hit.point.x, y: hit.point.y + 0.1, z: hit.point.z }
      this.cones?.updatePreviewPosition(pos)
    } else {
      this.cones?.updatePreviewPosition(null)
    }
  }

  onPointerDown = (e) => {
    if (e.button !== 0) return
    const camera = this.game.view.camera
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const floorMesh = this.floor?.mesh
    const intersects = this.raycaster.intersectObject(floorMesh, true)
    const hit = intersects[0]
    if (hit && this.cones?.spawn) {
      const spawnPos = { x: hit.point.x, y: hit.point.y + 0.5, z: hit.point.z }
      this.cones.spawn(spawnPos)
    }
  }

  /* ─────────────────────────────────────────────
   * Update Loop
   * ───────────────────────────────────────────── */
  update() {
    if(this.isEditing && this.cones?.instances) {
      for (const c of this.cones.instances) {
        const body = c.body
        if (!body || body.isKinematic()) continue

        const vel = body.linvel()
        // Limita la velocidad de los conos
        const maxSpeed = 0.5
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed
          body.setLinvel({ x: vel.x * scale, y: vel.y * scale, z: vel.z * scale }, true)
        }
      }
    }


    if (!this.vehicle) return
    const pos = this.vehicle.chassis.mesh.position
    const limit = this.floor.getLimit()
    const vel = this.vehicle.chassis.body.linvel()

    const isOutsideX = Math.abs(pos.x) > limit
    const isOutsideZ = Math.abs(pos.z) > limit
    const movingOutwardX = Math.sign(vel.x) === Math.sign(pos.x) && isOutsideX
    const movingOutwardZ = Math.sign(vel.z) === Math.sign(pos.z) && isOutsideZ

    const shouldBrake = movingOutwardX || movingOutwardZ
    this.vehicle.controller.isOutsideLimit = shouldBrake
    this.vehicle.visuals.isOutsideLimit = shouldBrake
  }
}

export default World
