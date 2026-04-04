import * as THREE from 'three/webgpu'
import Events from '../../core/Events.js'
import Floor from './floor/Floor.js'
import Environment from './environment/Environment.js'
import AssetManager from './assets/AssetManager.js'
import assetsConfig from './assets/assetsConfig.js'
import AssetSystem from './systems/AssetSystem.js'
import EditorSystem from './systems/EditorSystem.js'
import VehicleSystem from './systems/VehicleSystem.js'
import CargoZoneManager from './zones/CargoZoneManager.js'

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
      assetManagers: this.assetManagers,
      resources: this.resources
    })

    this.vehicleSystem = new VehicleSystem({ world: this })
    this.vehicleSystem.init()

    this._initEnvironment()
    this._initAssets()

    this.editorSystem = new EditorSystem({ world: this })
    this.editorSystem.init()
    this.editorSystem.setEditMode(this.isEditing)
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
  // assets normales
  for (const item of assetsConfig) {
    this.assetManagers[item.key] = new AssetManager(this.scene, {
      resourcePathName: item.resourcePathName,
      assetType: item.assetType
    })
  }
  
  this.assetManagers['cargoZone'] = new CargoZoneManager(this.scene, {
    resourceName: 'cargoZoneModel',
    assetManagers: this.assetManagers 
  })
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
    this.vehicleSystem?.update()
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