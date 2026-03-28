class AssetRegistry {
  constructor(scene, physics, { onZoneRemoved } = {}) {
    this.scene = scene
    this.physics = physics
    this.onZoneRemoved = onZoneRemoved

    this.assetIndex = new Map()
    this.assets = []
  }

  add(inst) {
    this.assetIndex.set(inst.group, inst)
    this.assets.push(inst)
  }

  find(object) {
    let node = object

    while (node) {
      const inst = this.assetIndex.get(node)
      if (inst) return inst
      node = node.parent
    }

    return null
  }

  getAll() {
    return this.assets
  }

  remove(group) {
    const inst = this.assetIndex.get(group)
    if (!inst) return null

    if (typeof inst.dispose === 'function') {
      inst.dispose()
    } else {
      if (inst.physicsEntity) {
        this.physics.removeEntity(inst.physicsEntity)
      }

      this.scene.remove(group)
    }

    this.assetIndex.delete(group)
    this.assets = this.assets.filter(a => a !== inst)

    if (inst.assetType === 'cargoZone') {
      this.onZoneRemoved?.('cargoZone')
    }

    return inst
  }
}

export default AssetRegistry
