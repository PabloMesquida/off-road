import * as THREE from 'three/webgpu'
import Events from '../../core/Events.js'
import Floor from './floor/Floor.js'
import Vehicle from './vehicle/Vehicle.js'
import Environment from './environment/Environment.js'
import AssetManager from './assets/AssetManager.js'
import assetsConfig from './assets/assetsConfig.js'
import AssetSystem from "./systems/AssetSystem.js"
import EditorSystem from "./systems/EditorSystem.js"

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

    // Cuando los recursos estén listos inicializamos el mundo
    this.resources.events.on('ready', () => {
      this._onResourcesReady()
    })
  }

  _onResourcesReady() {
    this.assetSystem = new AssetSystem({
      scene: this.scene,
      physics: this.game.physics,
      assetManagers: this.assetManagers
    })


    this._initVehicle()
    this._initEnvironment()
    this._initAssets()

    this.editorSystem = new EditorSystem({ world: this })
    this.editorSystem.init()
    this.editorSystem.setEditMode(this.isEditing)
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
    this.assetSystem.load()
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
    return this.assetSystem.find(object)
  }

  /*────────────────────────────*/
  /* Edit Mode */
  /*────────────────────────────*/

  toggleEditMode(isEditing) {
    this.isEditing = isEditing
    if (this.editorSystem) {
      this.editorSystem.setEditMode(isEditing)
    }
  }

  /*────────────────────────────*/
  /* Delete */
  /*────────────────────────────*/

  deleteAsset(group) {
    const inst = this.assetSystem.delete(group)
    if (!inst) return

    this.editorSystem?.onAssetDeleted?.()
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
  }
}

export default World