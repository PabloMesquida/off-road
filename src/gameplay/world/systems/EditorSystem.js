import * as THREE from 'three/webgpu'
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

    this.world.assetSystem.onZoneRemoved = (type) => {
      if (type === 'cargoZone') {
        this.tweakpaneUI?.setPlaceAssetEnabled('cargoZone', true)
      }
    }

    this._syncInitialState()
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

        // ─────────────────────────────
        // Cargo Zone
        // ─────────────────────────────

        if (assetData.assetType === 'cargoZone') {
          if (isDragging) {
            assetData.setBoxesKinematic?.()
          } else {
            assetData.restoreBoxesDynamic?.()
          }
        }

        const body = assetData.body
        const inst = assetData

        if (isDragging) {
          assetData.originalBodyType = body.bodyType()

          assetData.originalPosition =
            selectedAsset.position.clone?.() ||
            new THREE.Vector3().copy(selectedAsset.position)

          assetData.originalQuaternion =
            selectedAsset.quaternion.clone?.() ||
            new THREE.Quaternion().copy(selectedAsset.quaternion)

          body.setBodyType(
            RAPIER.RigidBodyType.KinematicPositionBased,
            true
          )

          return
        }

        if (inst?.colliderRoot) {
          inst.group.updateMatrixWorld(true)

          const worldPos = new THREE.Vector3()
          const worldQuat = new THREE.Quaternion()

          inst.colliderRoot.getWorldPosition(worldPos)
          inst.colliderRoot.getWorldQuaternion(worldQuat)

          const insideCargoZone =
            this.world.assetSystem.isInsideCargoZone(
              worldPos,
              inst.group
            )

          if (
            insideCargoZone &&
            inst.assetType !== 'cargoZone'
          ) {
            const originalPos =
              assetData.originalPosition ||
              selectedAsset.position

            const originalQuat =
              assetData.originalQuaternion ||
              selectedAsset.quaternion

            selectedAsset.position.copy(originalPos)
            selectedAsset.quaternion.copy(originalQuat)

            body.setTranslation(
              {
                x: originalPos.x,
                y: originalPos.y,
                z: originalPos.z
              },
              true
            )

            body.setRotation(
              {
                x: originalQuat.x,
                y: originalQuat.y,
                z: originalQuat.z,
                w: originalQuat.w
              },
              true
            )

            body.setBodyType(
              assetData.originalBodyType,
              true
            )

            return
          }

          body.setTranslation(
            {
              x: worldPos.x,
              y: worldPos.y,
              z: worldPos.z
            },
            true
          )

          body.setRotation(
            {
              x: worldQuat.x,
              y: worldQuat.y,
              z: worldQuat.z,
              w: worldQuat.w
            },
            true
          )
        } else {
          const insideCargoZone =
            this.world.assetSystem.isInsideCargoZone(
              selectedAsset.position,
              selectedAsset
            )

          if (
            insideCargoZone &&
            assetData.assetType !== 'cargoZone'
          ) {
            const originalPos =
              assetData.originalPosition ||
              selectedAsset.position

            const originalQuat =
              assetData.originalQuaternion ||
              selectedAsset.quaternion

            selectedAsset.position.copy(originalPos)
            selectedAsset.quaternion.copy(originalQuat)

            body.setTranslation(
              {
                x: originalPos.x,
                y: originalPos.y,
                z: originalPos.z
              },
              true
            )

            body.setRotation(
              {
                x: originalQuat.x,
                y: originalQuat.y,
                z: originalQuat.z,
                w: originalQuat.w
              },
              true
            )

            body.setBodyType(
              assetData.originalBodyType,
              true
            )

            return
          }

          body.setTranslation(
            selectedAsset.position,
            true
          )

          body.setRotation(
            selectedAsset.quaternion,
            true
          )
        }

        body.setBodyType(
          assetData.originalBodyType,
          true
        )
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

        if (inst.assetType === 'cargoZone') {
          this.tweakpaneUI?.setPlaceAssetEnabled('cargoZone', false)
        }
      },
      canPlaceAsset: (type, position) => {
        return this.world.assetSystem.canPlace(type, position)
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
      getVehicle: () => this.world.vehicleSystem.getVehicle(),
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

  _syncInitialState() {
    const hasCargoZone = this.world.assetSystem
      .getAll()
      .some(a => a.assetType === 'cargoZone')

    if (hasCargoZone) {
      this.tweakpaneUI?.setPlaceAssetEnabled('cargoZone', false)
    }
  }

  setEditMode(isEditing) {
    this.world.isEditing = isEditing
    this.editorController?.setEditMode(isEditing)
  }

  onAssetDeleted() {
    this.transformManager?.detach()
  }

  update() {
    if (!this.transformManager?.dragging) return

    const selected = this.transformManager?.selectedAsset
    if (!selected) return

    const assetData = this.world.assetSystem.find(selected)
    if (!assetData?.body) return

    if (assetData.assetType === 'cargoZone') {
      assetData.updateAttachedBoxes?.()
    }

    const body = assetData.body
    if (!body.isKinematic?.()) return

    const inst = assetData

    if (inst?.colliderRoot) {
      inst.group.updateMatrixWorld(true)

      const worldPos = new THREE.Vector3()
      const worldQuat = new THREE.Quaternion()

      inst.colliderRoot.getWorldPosition(worldPos)
      inst.colliderRoot.getWorldQuaternion(worldQuat)

      const insideCargoZone = this.world.assetSystem.isInsideCargoZone(worldPos, inst.group)

      if (insideCargoZone && inst.assetType !== 'cargoZone') {
        return
      }

      body.setNextKinematicTranslation(worldPos)
      body.setNextKinematicRotation(worldQuat)
      return
    }

    const insideCargoZone = this.world.assetSystem.isInsideCargoZone(selected.position, selected)

    if (insideCargoZone && assetData.assetType !== 'cargoZone') {
      return
    }

    body.setNextKinematicTranslation(selected.position)
    body.setNextKinematicRotation(selected.quaternion)
  }
}

export default EditorSystem