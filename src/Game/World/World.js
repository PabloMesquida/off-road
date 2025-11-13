import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import AssetManager from './Assets/AssetManager.js'
import PlacingController from './PlacingController.js'
import TransformControlsManager from './TransformControlsManager.js'

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

    this.domElement = this.game.domElement
    this.camera = null

    this.isEditing = false
    this._isDraggingAsset = false
    this.isHoveringAsset = false

    this.assetManagers = {}

    // tweakpane
    this.initTweakpane()

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene, this.game.physics)
      if (this.vehicle?.chassis?.mesh) {
        this.initialVehicleRotation.copy(this.vehicle.chassis.mesh.quaternion)
      }
      this.environment = new Environment(this.scene)

      this.assetManagers.cone = new AssetManager(this.scene, {
        resourcePathName: "coneModel",
        assetType: "cone"
      })
      this.assetManagers.barrel = new AssetManager(this.scene, {
        resourcePathName: "barrelModel",
        assetType: "barrel"
      })

      // Inicializar subcontroladores
      this.placing = new PlacingController({
        scene: this.scene,
        domElement: this.domElement,
        cameraGetter: () => this.game.view.camera,
        floor: this.floor,
        assetManagers: this.assetManagers
      })

      this.transformManager = new TransformControlsManager({
        scene: this.scene,
        cameraGetter: () => this.game.view.camera,
        domElement: this.domElement,
        inputsEvents: this.inputs.events,
        onChangeKinematic: (isDragging, selectedAsset) => {
           this._isDraggingAsset = !!isDragging
          const assetData = this.findAssetData(selectedAsset)
          if (!assetData?.body) return
          const body = assetData.body
          console.log(body)
          if (isDragging) {
            // Mientras arrastras → kinemático
            body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
          } else {
            // Al soltar → teletransporta al Dynamic a la posición final
            body.setTranslation(selectedAsset.position, true)
            body.setRotation(selectedAsset.quaternion, true)
            body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
          }
        }
      })
    })

    this.toggleEditMode(this.isEditing)
  }

  /*──────────────────────────────────────────────
   * Tweakpane
   *──────────────────────────────────────────────*/
  initTweakpane() {
    try {
      this.pane = this.game.pane
      this.assetsfolder = this.pane.addFolder({ title: 'Assets', expanded: false })
      this.editParam = { editMode: false }

      this.pane.addBinding(this.editParam, 'editMode', { label: 'EDIT MODE' })
        .on('change', ev => this.toggleEditMode(ev.value))

      this.placingButtonCone = this.assetsfolder.addButton({ title: 'Cone' })
      this.placingButtonCone.on('click', () => this.placing?.togglePlacing('cone'))

      this.placingButtonBarrel = this.assetsfolder.addButton({ title: 'Barrel' })
      this.placingButtonBarrel.on('click', () => this.placing?.togglePlacing('barrel'))

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

  /*──────────────────────────────────────────────
   * Cursor
   *──────────────────────────────────────────────*/
  updateCursor() {
    if (!this.domElement) return
    if (this.placing?.isPlacing) this.domElement.style.cursor = 'crosshair'
    else if (this.isDraggingAsset) this.domElement.style.cursor = 'grabbing'
    else if (this.isHoveringAsset) this.domElement.style.cursor = 'pointer'
    else if (this.isEditing) this.domElement.style.cursor = 'grab'
    else this.domElement.style.cursor = 'default'
  }

  /*──────────────────────────────────────────────
   * Edit Mode
   *──────────────────────────────────────────────*/
  toggleEditMode(isEditing) {
    this.isEditing = isEditing
    this.updateTweakpaneState(isEditing)

    if (this.game?.view?.setEditMode)
      this.game.view.setEditMode(this.isEditing)

    if (this.floor?.setEditableState)
      this.floor.setEditableState(isEditing)

    if (isEditing) {
      console.log('Edit mode ON')

      if (this.vehicle?.chassis?.body) {
        const body = this.vehicle.chassis.body
        body.setTranslation(this.initialVehiclePosition, true)
        body.setRotation(this.initialVehicleRotation, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }

      this.transformManager?.create()

      // Listeners de hover y selección
      this.domElement.addEventListener('pointermove', this.onPointerHoverAsset)
      this.domElement.addEventListener('pointerdown', this.onPointerSelectAsset)
    } else {
      console.log('Edit mode OFF')

      this.placing?.disablePlacing()
      this.transformManager?.dispose()

      this._isDraggingAsset = false
      this.isHoveringAsset = false

      if (this.transformManager?.selectedAsset) {
        this.highlightAsset(this.transformManager.selectedAsset, false)
        this.transformManager.detach()
      }

      this.domElement.removeEventListener('pointermove', this.onPointerHoverAsset)
      this.domElement.removeEventListener('pointerdown', this.onPointerSelectAsset)
    }

    this.updateCursor()
  }

  /*──────────────────────────────────────────────
   * Asset Helpers
   *──────────────────────────────────────────────*/
  findAssetData(group) {
    if (!group || !this.assetManagers) return null
    for (const type in this.assetManagers) {
      const manager = this.assetManagers[type]
      if (manager?.instances) {
        const found = manager.instances.find(i => i.group === group)
        if (found) return found
      }
    }
    return null
  }

  getAllAssetInstances() {
    const allInstances = []
    for (const type in this.assetManagers) {
      const manager = this.assetManagers[type]
      if (manager?.instances) allInstances.push(...manager.instances)
    }
    return allInstances
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
        } else if (c.userData.originalMaterial) {
          c.material.dispose()
          c.material = c.userData.originalMaterial
          delete c.userData.originalMaterial
        }
      }
    })
  }

  findAssetGroup(object) {
    let node = object
    while (node) {
      const assetData = this.findAssetData(node)
      if (assetData) return node
      node = node.parent
    }
    return null
  }

  /*──────────────────────────────────────────────
   * Hover & Select Assets
   *──────────────────────────────────────────────*/
  
   onPointerHoverAsset = (e) => {
     if (!this.isEditing || this.placing?.isPlacing ||  this.transformManager?.transform?.dragging) return
     const camera = this.game.view.camera
     if (!camera) return

     const rect = this.domElement.getBoundingClientRect()
     const pointer = new THREE.Vector2(
       ((e.clientX - rect.left) / rect.width) * 2 - 1,
       -((e.clientY - rect.top) / rect.height) * 2 + 1
     )

     const raycaster = new THREE.Raycaster()
     raycaster.setFromCamera(pointer, camera)

     const allAssets = this.getAllAssetInstances().map(i => i.group)
     const intersects = raycaster.intersectObjects(allAssets, true)

     if (intersects.length > 0) {
       const hit = intersects[0]
       const assetGroup = this.findAssetGroup(hit.object)
       if (assetGroup && assetGroup !== this.hoveredAsset) {
         this.highlightAsset(this.hoveredAsset, false)
         this.hoveredAsset = assetGroup
         this.highlightAsset(this.hoveredAsset, true)
         this.isHoveringAsset = true
       }
     } else {
      this.highlightAsset(this.hoveredAsset, false)
       this.hoveredAsset = null
       this.isHoveringAsset = false
     }

     this.updateCursor()
   }


   onPointerSelectAsset = (e) => {
     if (!this.isEditing || this.placing?.isPlacing || this.transformManager?.transform?.dragging) return
     if (e.button !== 0) return
     const camera = this.game.view.camera
     if (!camera) return

     const rect = this.domElement.getBoundingClientRect()
     const pointer = new THREE.Vector2(
       ((e.clientX - rect.left) / rect.width) * 2 - 1,
       -((e.clientY - rect.top) / rect.height) * 2 + 1
     )

     const raycaster = new THREE.Raycaster()
     raycaster.setFromCamera(pointer, camera)

     const allAssets = this.getAllAssetInstances().map(i => i.group)
     const intersects = raycaster.intersectObjects(allAssets, true)

     if (intersects.length > 0) {
       const hit = intersects[0]
       const assetGroup = this.findAssetGroup(hit.object)
       if (assetGroup && this.transformManager) {
         if (this.transformManager.selectedAsset !== assetGroup) {
           this.highlightAsset(this.transformManager.selectedAsset, false)
           this.transformManager.attach(assetGroup)
           this.highlightAsset(assetGroup, true)
         }
       }
     } else if (this.transformManager) {
       this.highlightAsset(this.transformManager.selectedAsset, false)
       this.transformManager.detach()
     }

     this.updateCursor()
   }

  /*────────────────────────────────────────────── 
  * Public getters 
  *──────────────────────────────────────────────*/ 
  get isPlacingAsset() { 
    return this.placing?.isPlacing ?? false 
  }
  get isDraggingAsset() { 
    const transform = this.transformManager?.transform 
    return transform?.dragging ?? false 
  }

  /*──────────────────────────────────────────────
   * Update Loop
   *──────────────────────────────────────────────*/
  update() {

    const selected = this.transformManager?.selectedAsset
    if (selected) {
      const assetData = this.findAssetData(selected)
      if (assetData?.body && assetData.body.isKinematic && assetData.body.isKinematic()) {
        // adaptar por COM si lo tienes en assetData.physics.massProperties.com
        const com = assetData.physics?.massProperties?.com || { x: 0, y: 0, z: 0 }

        // worldPosition = selected.position (si tu group.position es world local)
        // Si tu mesh no está en root world space, usa selected.getWorldPosition(tempVec)
        const worldPos = selected.position

        // Ajuste simple por COM (si tu posición visual corresponde al root y Rapier usa COM):
        const bodyPos = { x: worldPos.x + com.x, y: worldPos.y + com.y, z: worldPos.z + com.z }

        assetData.body.setNextKinematicTranslation?.(bodyPos)
        const q = selected.quaternion
        assetData.body.setNextKinematicRotation?.({ x: q.x, y: q.y, z: q.z, w: q.w })
      }
    }


    for (const assetType in this.assetManagers) {
      const manager = this.assetManagers[assetType]
      if (manager?.instances) {
        for (const instance of manager.instances) {
          const body = instance.body
          if (!body || body.isKinematic()) continue
          const vel = body.linvel()
          const maxSpeed = 0.5
          const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2)
          if (speed > maxSpeed) {
            const scale = maxSpeed / speed
            body.setLinvel({ x: vel.x * scale, y: vel.y * scale, z: vel.z * scale }, true)
          }
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
