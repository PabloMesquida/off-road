import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Floor from './floor/Floor.js'
import Vehicle from './vehicle/Vehicle.js'
import Environment from './environment/Environment.js'
import AssetManager from './assets/AssetManager.js'
import assetsConfig from './assets/assetsConfig.js'
import AssetRegistry from './assets/AssetRegistry.js'
import Events from '../../core/Events.js'
import TweakpaneUI from '../../editor/UI/TweakpaneUI.js'
import PlacingController from '../../editor/controllers/PlacingController.js'
import EditorController from '../../editor/controllers/EditorController.js'
import AssetInteractionController from '../../editor/controllers/AssetInteractionController.js'
import TransformGizmoManager from '../../editor/gizmos/TransformGizmoManager.js'

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

    this.assetManagers = {}
    this.assetRegistry = new AssetRegistry(this.scene, this.game.physics)

    this.tweakpaneUI = null
    this.placing = null
    this.transformManager = null
    this.assetInteraction = null

    // Cuando los recursos estén listos inicializamos el mundo
    this.resources.events.on('ready', () => {
      this._onResourcesReady()
    })
  }

  _onResourcesReady() {
    this._initVehicle()
    this._initEnvironment()
    this._initAssets()
    this._initControllers()
  }

  _initVehicle() {
    this.vehicle = new Vehicle(this.scene, this.game.physics)

    if (this.vehicle?.chassis?.mesh) {
      this.initialVehicleRotation.copy(this.vehicle.chassis.mesh.quaternion)
    }
  }

  _initEnvironment() {
    this.environment = new Environment(this.scene)
  }

  _initAssets() {
    this.initAssetManagers()
    this.loadAssetsFromLocal()
  }

  _initControllers() {
    this._createPlacingController()
    this._createTransformManager()
    this._createUI()
    this._createEditorController()
    this._createInteractionController()
  }

  _createPlacingController() {
    this.placing = new PlacingController({
      scene: this.scene,
      domElement: this.domElement,
      cameraGetter: () => this.game.view.camera,
      floor: this.floor,
      assetManagers: this.assetManagers,
      onAssetSpawned: (inst) => {
        this.assetRegistry.add(inst)
      }
    })
  }

  _createTransformManager() {
    this.transformManager = new TransformGizmoManager({
      scene: this.scene,
      cameraGetter: () => this.game.view.camera,
      domElement: this.domElement,
      inputsEvents: this.inputs.events,
      onChangeKinematic: (isDragging, selectedAsset) => {

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
  }

  _createUI() {
    this.tweakpaneUI = new TweakpaneUI({
      pane: this.game.debugUI.pane,
      onToggleEditMode: (isEditing) => this.toggleEditMode(isEditing),
      onPlaceAsset: (type) => {
        this.placing?.togglePlacing(type)
        this.transformManager?.detach()
      },
      onSaveAssets: () => this.saveAssetsToLocal()
    })
  }

  _createEditorController() {
    this.editorController = new EditorController({
      view: this.game.view,
      floor: this.floor,
      vehicle: this.vehicle,
      placing: this.placing,
      transformManager: this.transformManager,
      tweakpaneUI: this.tweakpaneUI,
      initialVehiclePosition: this.initialVehiclePosition,
      initialVehicleRotation: this.initialVehicleRotation
    })
  }

  _createInteractionController() {
    this.assetInteraction = new AssetInteractionController({
      scene: this.scene,
      domElement: this.domElement,
      cameraGetter: () => this.game.view.camera,
      getAllAssetInstances: () => this.getAllAssetInstances(),
      findAssetData: (g) => this.findAssetData(g),
      transformManager: this.transformManager,
      isEditingGetter: () => this.isEditing,
      isPlacingGetter: () => this.placing?.isPlacing,
      isDraggingGetter: () => this.transformManager?.dragging ?? false
    })
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

  findAssetData(object) {
    return this.assetRegistry.find(object)
  }

  getAllAssetInstances() {
    return this.assetRegistry.getAll()
  }

  /*────────────────────────────*/
  /* Edit Mode */
  /*────────────────────────────*/

  toggleEditMode(isEditing) {
    this.isEditing = isEditing
    this.editorController?.setEditMode(isEditing)
  }

  /*────────────────────────────*/
  /* Delete */
  /*────────────────────────────*/

  deleteAsset(group) {
    const inst = this.assetRegistry.remove(group)
    if (!inst) return

    this.transformManager?.detach()
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

    localStorage.setItem('world_assets', JSON.stringify(data))
  }

  loadAssetsFromLocal() {
    const json = localStorage.getItem('world_assets')
    if (!json) return

    const data = JSON.parse(json)

    for (const item of data) {
      const manager = this.assetManagers[item.type]
      if (!manager) continue

      const inst = manager.spawn(item.position)
      this.assetRegistry.add(inst)

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
    return this.transformManager?.dragging ?? false
  }

  /*────────────────────────────*/
  /* Cleanup */
  /*────────────────────────────*/

  dispose() {
    try {
      this.tweakpaneUI?.dispose()
    } catch (e) {
      // ignore
    }

    try {
      this.transformManager?.dispose()
    } catch (e) {
      // ignore
    }

    try {
      this.assetInteraction?.dispose?.()
    } catch (e) {
      // ignore
    }

    // Si quieres borrar la escena/physics también puedes hacerlo aquí
  }
}

export default World