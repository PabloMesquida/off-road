import Game from '../../../core/Game.js'
import CargoZone from './CargoZone.js'

class CargoZoneManager {
  constructor(scene, options = {}) {
    this.game = new Game()

    this.scene = scene
    this.resources = this.game.resources
    this.physics = this.game.physics

    this.resourceName = options.resourceName || 'cargoZone'
    this.width = options.width ?? 8
    this.depth = options.depth ?? 8
    this.color = options.color ?? 0xffff00
    this.borderWidth = options.borderWidth ?? 0.034

    this.preview = null
  }

  spawn(position = { x: 0, y: 0, z: 0 }, rotationY = 0) {
    return new CargoZone({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      position,
      rotationY,
      width: this.width,
      depth: this.depth,
      color: this.color,
      borderWidth: this.borderWidth,
      resourceName: this.resourceName,
      createCollider: true,
    })
  }

  createPreview() {
    if (this.preview?.group) return this.preview

    this.preview = new CargoZone({
      scene: this.scene,
      resources: this.resources,
      physics: null,
      position: { x: 0, y: 0, z: 0 },
      rotationY: 0,
      width: this.width,
      depth: this.depth,
      color: this.color,
      borderWidth: this.borderWidth,
      resourceName: this.resourceName,
      createCollider: false,
    })

    this.preview.group.traverse((c) => {
      if (c.material) {
        c.material.opacity = 0.2
        c.material.transparent = true
        c.material.depthWrite = false
      }
    })

    return this.preview
  }

  updatePreviewPosition(worldPos) {
    if (!this.preview?.group) return

    if (!worldPos) {
      this.preview.group.visible = false
      return
    }

    this.preview.group.visible = true
    this.preview.setPosition(worldPos)
  }

  updatePreviewRotation(rotationY = 0) {
    if (!this.preview?.group) return
    this.preview.setRotationY(rotationY)
  }

  disposePreview() {
    if (!this.preview) return
    this.preview.dispose()
    this.preview = null
  }
}

export default CargoZoneManager