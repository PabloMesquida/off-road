import * as THREE from 'three/webgpu'

class AssetInteractionController {
  constructor(options) {
    this.scene = options.scene
    this.cameraGetter = options.cameraGetter
    this.domElement = options.domElement
    this.getAllAssetInstances = options.getAllAssetInstances
    this.findAssetData = options.findAssetData
    this.transformManager = options.transformManager
    this.isEditingGetter = options.isEditingGetter
    this.isPlacingGetter = options.isPlacingGetter
    this.isDraggingGetter = options.isDraggingGetter

    this.hoveredAsset = null
    this._isHoveringAsset = false

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this.domElement.addEventListener('pointermove', this.onPointerHover)
    this.domElement.addEventListener('pointerdown', this.onPointerSelect)
  }

  onPointerHover = (e) => {
    if (!this.isEditingGetter() || this.isPlacingGetter() || this.transformManager?.transform?.dragging) return

    const camera = this.cameraGetter()
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    this.raycaster.setFromCamera(this.pointer, camera)

    const allAssets = this.getAllAssetInstances().map(i => i.group)
    const intersects = this.raycaster.intersectObjects(allAssets, true)

    if (intersects.length > 0) {
      const assetGroup = this.findAssetGroup(intersects[0].object)
      if (assetGroup && assetGroup !== this.hoveredAsset) {
        this.highlight(this.hoveredAsset, false)
        this.hoveredAsset = assetGroup
        this.highlight(this.hoveredAsset, true)
        this._isHoveringAsset = true
      }
    } else {
      this.highlight(this.hoveredAsset, false)
      this.hoveredAsset = null
      this._isHoveringAsset = false
    }
  }

  onPointerSelect = (e) => {
    if (!this.isEditingGetter() || this.isPlacingGetter() || this.transformManager?.transform?.dragging) return
    if (e.button !== 0) return

    const camera = this.cameraGetter()
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    this.raycaster.setFromCamera(this.pointer, camera)

    const allAssets = this.getAllAssetInstances().map(i => i.group)
    const intersects = this.raycaster.intersectObjects(allAssets, true)

    if (intersects.length > 0) {
      const assetGroup = this.findAssetGroup(intersects[0].object)
      if (assetGroup && this.transformManager) {
        this.transformManager.attach(assetGroup)
        this.highlight(assetGroup, true)
      }
    } else {
      this.transformManager.detach()
    }
  }

  highlight(group, active) {
    if (!group) return
    group.traverse(c => {
      if (!c.isMesh) return
      if (active) {
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
}

export default AssetInteractionController