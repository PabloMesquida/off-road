import * as THREE from 'three/webgpu'
import CargoZone from '../../gameplay/world/zones/CargoZone.js'

export default class PlacingController {
  constructor({ scene, domElement, cameraGetter, floor, assetManagers, onAssetSpawned }) {
    this.scene = scene
    this.domElement = domElement
    this.cameraGetter = cameraGetter
    this.floor = floor
    this.assetManagers = assetManagers
    this.onAssetSpawned = onAssetSpawned

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this.isPlacing = false
    this.currentAssetType = null
    this.previewRotation = 0  

    this.cargoZoneInstance = null
    this.previewZone = null

    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onWheel = this.onWheel.bind(this)
  }

  // ─────────────────────────────────────────────
  // Toggle placing
  // ─────────────────────────────────────────────

  togglePlacing(assetType) {
    if (this.isPlacing && this.currentAssetType === assetType) {
      this.disablePlacing()
      return
    }

    // limpiar preview anterior
    if (this.isPlacing && this.currentAssetType) {
      const prevManager = this.assetManagers[this.currentAssetType]
      prevManager?.disposePreview?.()

      if (this.previewZone) {
        this.previewZone.dispose()
        this.previewZone = null
      }
    }

    this.currentAssetType = assetType
    this.enablePlacing()
  }

  // ─────────────────────────────────────────────
  // Enable placing
  // ─────────────────────────────────────────────

  enablePlacing() {
    if (!this.currentAssetType) return

    this.previewRotation = 0 

    if (this.currentAssetType === "cargoZone") {

      if (!this.previewZone) {
        this.previewZone = new CargoZone({
          scene: this.scene,
          position: { x: 0, y: 0, z: 0 }
        })

        // hacerlo semi-transparente (preview)
        this.previewZone.group.traverse(c => {
          if (c.material) {
            c.material.opacity = 0.2
          }
        })
      }

    } else {
      const manager = this.assetManagers[this.currentAssetType]
      manager?.createPreview()
    }

    this.domElement.addEventListener('pointermove', this.onPointerMove)
    this.domElement.addEventListener('pointerdown', this.onPointerDown)
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false })

    this.isPlacing = true
  }

  // ─────────────────────────────────────────────
  // Disable placing
  // ─────────────────────────────────────────────

  disablePlacing() {
    for (const type in this.assetManagers) {
      this.assetManagers[type]?.disposePreview?.()
    }

    if (this.previewZone) {
      this.previewZone.dispose()
      this.previewZone = null
    }

    this.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.domElement.removeEventListener('wheel', this.onWheel)

    this.isPlacing = false
    this.currentAssetType = null
  }

  // ─────────────────────────────────────────────
  // Pointer move (preview)
  // ─────────────────────────────────────────────

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

      if (this.currentAssetType === "cargoZone") {

        this.previewZone?.setPosition({
          x: hit.point.x,
          y: hit.point.y,
          z: hit.point.z
        })

      } else {

        manager?.updatePreviewPosition({
          x: hit.point.x,
          y: hit.point.y + 0.1,
          z: hit.point.z
        })

      }

    } else {
      manager?.updatePreviewPosition?.(null)
    }
  }

  // ─────────────────────────────────────────────
  // Pointer down (spawn)
  // ─────────────────────────────────────────────

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

    if (!hit) return

    const position = { x: hit.point.x, y: hit.point.y, z: hit.point.z }

    // ───────────── cargoZone ─────────────

    if (this.currentAssetType === "cargoZone") {

      if (this.cargoZoneInstance) {
        console.warn("Ya existe una CargoZone")
        return
      }

      const zone = new CargoZone({
        scene: this.scene,
        position
      })

      this.cargoZoneInstance = zone

      // permitir usar TransformManager
      this.onAssetSpawned?.({
        group: zone.group,
        assetType: 'cargoZone',
        isZone: true
      })

      return
    }

    // ───────────── assets normales ─────────────

    if (this.floor.isInsideStartZone(position)) {
      console.warn('❌ No se puede colocar objetos en el área de salida del vehículo')
      return
    }

    const manager = this.assetManagers[this.currentAssetType]
    const inst = manager?.spawn?.(position, this.previewRotation)

    if (inst) {
      this.onAssetSpawned?.(inst)
    }
  }

  // ─────────────────────────────────────────────
  // Rotación preview
  // ─────────────────────────────────────────────

  onWheel(e) {
    if (!this.isPlacing || !this.currentAssetType) return

    e.preventDefault()

    const manager = this.assetManagers[this.currentAssetType]

    const step = Math.PI / 8

    if (e.deltaY > 0) {
      this.previewRotation += step
    } else {
      this.previewRotation -= step
    }

    this.previewRotation = this.previewRotation % (Math.PI * 8)

    manager?.updatePreviewRotation?.(this.previewRotation)
  }

  // ─────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────

  clearCargoZone() {
    this.cargoZoneInstance = null
  }

  dispose() {
    this.disablePlacing()
    this.raycaster = null
  }
}