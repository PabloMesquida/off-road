import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import AssetManager from './Assets/AssetManager.js'
import PlacingController from './PlacingController.js'
import TransformControlsManager from './TransformControlsManager.js'
import AssetInteractionController from './AssetInteractionController.js'
import assetsConfig from './Assets/assetsConfig.js'

class World {
  constructor(game) {
    this.game = game
    this.inputs = this.game.inputs
    this.scene = new THREE.Scene()
    this.events = new Events()
    this.resources = this.game.resources

    this.floor = new Floor(this.scene, this.game.physics, { x: 160, y: 0.2, z: 160 })
    this.initialVehiclePosition = new THREE.Vector3(0, 2, 0)
    this.initialVehicleRotation = new THREE.Quaternion()

    this.domElement = this.game.domElement

    this.isEditing = false
    this._isDraggingAsset = false

    this.assetManagers = {}

    // this.initTweakpane()

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene, this.game.physics)

      if (this.vehicle?.chassis?.mesh) {
        this.initialVehicleRotation.copy(this.vehicle.chassis.mesh.quaternion)
      }

      this.environment = new Environment(this.scene)

      this.initTweakpane()
      this.initAssetManagers()
      this.loadAssetsFromLocal()

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

          if (isDragging) {
            assetData.originalBodyType = body.bodyType()
            body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
          } else {
            body.setTranslation(selectedAsset.position, true)
            body.setRotation(selectedAsset.quaternion, true)
            body.setBodyType(assetData.originalBodyType, true)
          }
        },
        onDeleteAsset: (assetGroup) => this.deleteAsset(assetGroup)
      })

      // 🔥 Nuevo controlador de interacción
      this.assetInteraction = new AssetInteractionController({
        scene: this.scene,
        domElement: this.domElement,
        cameraGetter: () => this.game.view.camera,
        getAllAssetInstances: () => this.getAllAssetInstances(),
        findAssetData: (g) => this.findAssetData(g),
        transformManager: this.transformManager,
        isEditingGetter: () => this.isEditing,
        isPlacingGetter: () => this.placing?.isPlacing,
        isDraggingGetter: () => this._isDraggingAsset
      })
    })
  }

   initTweakpane() {
    try {
      this.pane = this.game.pane
      this.assetsfolder = this.pane.addFolder({ title: 'Assets', expanded: false })
      this.signsFolder = this.assetsfolder.addFolder({ title: 'Signs', expanded: false })
      this.editParam = { editMode: false }

      this.pane.addBinding(this.editParam, 'editMode', { label: 'EDIT MODE' })
        .on('change', ev => this.toggleEditMode(ev.value))

      this.placingButtonCone = this.assetsfolder.addButton({ title: 'Cone' })
      this.placingButtonCone.on('click', () => { 
        this.placing?.togglePlacing('cone')
        this.transformManager.detach()
      })

      this.placingButtonBarrel = this.assetsfolder.addButton({ title: 'Barrel' })
      this.placingButtonBarrel.on('click', () => {
        this.placing?.togglePlacing('barrel')
        this.transformManager.detach()
      })

      this.placingButtonRamp = this.assetsfolder.addButton({ title: 'Ramp' })
      this.placingButtonRamp.on('click', () => {
        this.placing?.togglePlacing('ramp')
        this.transformManager.detach()
      })

      this.placingButtonBump = this.assetsfolder.addButton({ title: 'Speed Bump' })
      this.placingButtonBump.on('click', () => {
        this.placing?.togglePlacing('bump')
        this.transformManager.detach()
      })

      this.placingButtonBarrier = this.assetsfolder.addButton({ title: 'Concrete Barrier' })
      this.placingButtonBarrier.on('click', () => {
        this.placing?.togglePlacing('barrier')
        this.transformManager.detach()
      })

      this.placingButtonTire = this.assetsfolder.addButton({ title: 'Tire' })
      this.placingButtonTire.on('click', () => {
        this.placing?.togglePlacing('tire')
        this.transformManager.detach()
      })

      this.placingButtonSignAhead = this.signsFolder.addButton({ title: 'Sign Ahead' })
      this.placingButtonSignAhead.on('click', () => {
        this.placing?.togglePlacing('signAhead')
        this.transformManager.detach()
      })

      this.placingButtonSignStop = this.signsFolder.addButton({ title: 'Sign Stop' })
      this.placingButtonSignStop.on('click', () => {
        this.placing?.togglePlacing('signStop')
        this.transformManager.detach()
      })

      this.placingButtonSignWarning = this.signsFolder.addButton({ title: 'Sign Warning' })
      this.placingButtonSignWarning.on('click', () => {
        this.placing?.togglePlacing('signWarning')
        this.transformManager.detach()
      })

      this.placingButtonSignNot = this.signsFolder.addButton({ title: 'Sign Do Not Enter' })
      this.placingButtonSignNot.on('click', () => {
        this.placing?.togglePlacing('signNot')
        this.transformManager.detach()
      })

      this.saveButton = this.assetsfolder.addButton({ title: 'Save Assets' })

      this.saveButton.on('click', () => {
        this.saveAssetsToLocal()
      })


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

  /*────────────────────────────*/
  /* Asset Managers */
  /*────────────────────────────*/

  initAssetManagers() {
    for (const item of assetsConfig) {
      this.assetManagers[item.key] = new AssetManager(this.scene, {
        resourcePathName: item.resourcePathName,
        assetType: item.assetType
      })
    }
  }

  findAssetData(group) {
    if (!group) return null
    for (const type in this.assetManagers) {
      const manager = this.assetManagers[type]
      const found = manager.instances?.find(i => i.group === group)
      if (found) return found
    }
    return null
  }

  getAllAssetInstances() {
    const all = []
    for (const type in this.assetManagers) {
      const manager = this.assetManagers[type]
      if (manager?.instances) all.push(...manager.instances)
    }
    return all
  }

  /*────────────────────────────*/
  /* Edit Mode */
  /*────────────────────────────*/

  toggleEditMode(isEditing) {
    this.isEditing = isEditing

    this.updateTweakpaneState(isEditing) 

    this.game.view.setEditableState(isEditing)
    this.game.view.setEditMode(isEditing)

    this.floor?.setEditableState?.(isEditing)

    if (isEditing) {
      if (this.vehicle?.chassis?.body) {
        const body = this.vehicle.chassis.body
        body.setTranslation(this.initialVehiclePosition, true)
        body.setRotation(this.initialVehicleRotation, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.setAngvel({ x: 0, y: 0, z: 0 }, true)
        this.vehicle.chassis.mesh.visible = false
        body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
      }

      this.transformManager?.create()
    } else {
      if (this.vehicle) {
        this.vehicle.chassis.mesh.visible = true
        this.vehicle.chassis.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
      }

      this.placing?.disablePlacing()
      this.transformManager?.dispose()
      this._isDraggingAsset = false
    }
  }

  /*────────────────────────────*/
  /* Delete */
  /*────────────────────────────*/

  deleteAsset(group) {
    let managerFound = null
    let index = -1

    for (const type in this.assetManagers) {
      const manager = this.assetManagers[type]
      index = manager.instances.findIndex(i => i.group === group)
      if (index !== -1) {
        managerFound = manager
        break
      }
    }

    if (!managerFound) return

    const instance = managerFound.instances[index]

    if (instance.physicsEntity) {
      this.game.physics.removeEntity(instance.physicsEntity)
    }

    this.scene.remove(group)
    managerFound.instances.splice(index, 1)
    this.transformManager.detach()
  }

  /*────────────────────────────*/
  /* Update */
  /*────────────────────────────*/

  update() {
    if (!this.vehicle) return

    const selected = this.transformManager?.selectedAsset

    if (selected) {
      const assetData = this.findAssetData(selected)
      if (assetData?.body?.isKinematic?.()) {
        const worldPos = selected.position
        assetData.body.setNextKinematicTranslation?.(worldPos)
        assetData.body.setNextKinematicRotation?.(selected.quaternion)
      }
    }

    const pos = this.vehicle.chassis.mesh.position
    const limit = this.floor.getLimit()
    const vel = this.vehicle.chassis.body.linvel()

    const isOutside =
      (Math.abs(pos.x) > limit && Math.sign(vel.x) === Math.sign(pos.x)) ||
      (Math.abs(pos.z) > limit && Math.sign(vel.z) === Math.sign(pos.z))

    this.vehicle.controller.isOutsideLimit = isOutside
    this.vehicle.visuals.isOutsideLimit = isOutside
  }

  /*────────────────────────────*/
  /* Persistence */
  /*────────────────────────────*/

  saveAssetsToLocal() {
    const data = this.getAllAssetInstances().map(inst => ({
      type: inst.assetType,
      position: inst.group.position,
      rotation: inst.group.quaternion
    }))

    localStorage.setItem("world_assets", JSON.stringify(data))
  }

  loadAssetsFromLocal() {
    const json = localStorage.getItem("world_assets")
    if (!json) return

    const data = JSON.parse(json)

    for (const item of data) {
      const manager = this.assetManagers[item.type]
      if (!manager) continue

      const inst = manager.spawn(item.position)
      inst.group.quaternion.set(
        item.rotation.x,
        item.rotation.y,
        item.rotation.z,
        item.rotation.w
      )

      if (inst.body) {
        inst.body.setTranslation(item.position, true)
        inst.body.setRotation(item.rotation, true)
      }
    }
  }

  get isPlacingAsset() {
    return this.placing?.isPlacing ?? false
  }

  get isDraggingAsset() {
    return this.transformManager?.transform?.dragging ?? false
  }
}

export default World
