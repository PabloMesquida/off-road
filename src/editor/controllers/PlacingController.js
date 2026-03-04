import * as THREE from 'three/webgpu'

export default class PlacingController {
  constructor({ scene, domElement, cameraGetter, floor, assetManagers, onAssetSpawned }) {
    this.scene =  scene
    this.domElement = domElement
    this.cameraGetter = cameraGetter
    this.floor = floor
    this.assetManagers = assetManagers
    this.onAssetSpawned = onAssetSpawned

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this.isPlacing = false
    this.currentAssetType = null

    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
  }

  togglePlacing(assetType) {
    // Si ya está colocando este mismo asset → desactivar
    if (this.isPlacing && this.currentAssetType === assetType) {
      this.disablePlacing()
      return
    }
    
    // Desactivar preview del asset previo
    if (this.isPlacing && this.currentAssetType) {
      const prevManager = this.assetManagers[this.currentAssetType]
      prevManager?.disposePreview?.()
    }

    this.currentAssetType = assetType
    this.enablePlacing()
  }

  enablePlacing() {
    if (!this.currentAssetType) return
    const manager = this.assetManagers[this.currentAssetType]
    manager?.createPreview()
    this.domElement.addEventListener('pointermove', this.onPointerMove)
    this.domElement.addEventListener('pointerdown', this.onPointerDown)
    this.isPlacing = true
  }

  disablePlacing() {
    for (const type in this.assetManagers) {
      this.assetManagers[type]?.disposePreview?.()
    }
    this.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.isPlacing = false
    this.currentAssetType = null
  }

  onPointerMove(e) {
    if (!this.isPlacing || !this.currentAssetType) return
    const camera = this.cameraGetter()
    if (!camera) return
    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const floorMesh = this.floor?.mesh
    const intersects = floorMesh ? this.raycaster.intersectObject(floorMesh, true) : []
    const hit = intersects[0]
    const manager = this.assetManagers[this.currentAssetType]
    if (hit) {
      manager?.updatePreviewPosition({ x: hit.point.x, y: hit.point.y + 0.1, z: hit.point.z })
    } else {
      manager?.updatePreviewPosition(null)
    }
  }

  onPointerDown(e) {
    if (!this.isPlacing || !this.currentAssetType) return
    if (e.button !== 0) return

    const camera = this.cameraGetter()
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const floorMesh = this.floor?.mesh
    const intersects = this.raycaster.intersectObject(floorMesh, true)
    const hit = intersects[0]

    if (hit) {
      const position = { x: hit.point.x, y: hit.point.y, z: hit.point.z }
      //  chequeo del área de salida del vehículo
      if (this.floor.isInsideStartZone(position)) {
        console.warn('❌ No se puede colocar objetos en el área de salida del vehículo')
        return
      }

      // Si pasa el filtro, se spawnea normalmente
      const manager = this.assetManagers[this.currentAssetType]
      const inst = manager?.spawn?.(position)

      if (inst) {
        this.onAssetSpawned?.(inst)
      }
    }
  }

  dispose() {
    this.disablePlacing()
    this.raycaster = null
  }
}

