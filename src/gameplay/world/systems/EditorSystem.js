import * as RAPIER from '@dimforge/rapier3d-compat'
import TweakpaneUI from "../../../editor/UI/TweakpaneUI.js"
import PlacingController from "../../../editor/controllers/PlacingController.js"
import EditorController from "../../../editor/controllers/EditorController.js"
import AssetInteractionController from "../../../editor/controllers/AssetInteractionController.js"
import TransformGizmoManager from "../../../editor/gizmos/TransformGizmoManager.js"

class EditorSystem {

  constructor({ world }) {
    this.world = world
    this.game = world.game
    this.scene = world.scene
    this.domElement = world.domElement

    this.transformManager = null
    this.placing = null
    this.editorController = null
    this.assetInteraction = null
    this.tweakpaneUI = null
  }

  init() {
    this._createTransformManager()
    this._createPlacingController()
    this._createUI()
    this._createEditorController()
    this._createInteractionController()
  }

  _createTransformManager() {
    this.transformManager = new TransformGizmoManager({
      scene: this.scene,
      cameraGetter: () => this.game.view.camera,
      domElement: this.domElement,
      inputsEvents: this.game.inputs.events,
      onChangeKinematic: (isDragging, selectedAsset) => {

        const assetData = this.world.assetSystem.find(selectedAsset)
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
      onDeleteAsset: (assetGroup) => {
        this.world.assetSystem.delete(assetGroup)
      }
    })
  }

  _createPlacingController() {
    this.placing = new PlacingController({
      scene: this.scene,
      domElement: this.domElement,
      cameraGetter: () => this.game.view.camera,
      floor: this.world.floor,
      assetManagers: this.world.assetManagers,
      onAssetSpawned: (inst) => {
        this.world.assetSystem.add(inst)
      }
    })
  }

  _createUI() {
    this.tweakpaneUI = new TweakpaneUI({
      pane: this.game.debugUI.pane,
      onToggleEditMode: (isEditing) => this.setEditMode(isEditing),
      onPlaceAsset: (type) => {
        this.placing?.togglePlacing(type)
        this.transformManager?.detach()
      },
      onSaveAssets: () => this.world.assetSystem.save()
    })
  }

  _createEditorController() {
    this.editorController = new EditorController({
      view: this.game.view,
      floor: this.world.floor,
      vehicle: this.world.vehicle,
      placing: this.placing,
      transformManager: this.transformManager,
      tweakpaneUI: this.tweakpaneUI,
      initialVehiclePosition: this.world.initialVehiclePosition,
      initialVehicleRotation: this.world.initialVehicleRotation
    })
  }

  _createInteractionController() {
    this.assetInteraction = new AssetInteractionController({
      scene: this.scene,
      domElement: this.domElement,
      cameraGetter: () => this.game.view.camera,
      getAllAssetInstances: () => this.world.assetSystem.getAll(),
      findAssetData: (g) => this.world.assetSystem.find(g),
      transformManager: this.transformManager,
      isEditingGetter: () => this.world.isEditing,
      isPlacingGetter: () => this.placing?.isPlacing,
      isDraggingGetter: () => this.transformManager?.dragging ?? false
    })
  }

  setEditMode(isEditing) {
    this.world.isEditing = isEditing
    this.editorController?.setEditMode(isEditing)
  }

  onAssetDeleted() {
    this.transformManager?.detach()
  }
}

export default EditorSystem
