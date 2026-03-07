import AssetRegistry from "../assets/AssetRegistry.js"

class AssetSystem {

  constructor({ scene, physics, assetManagers }) {

    this.scene = scene
    this.physics = physics
    this.assetManagers = assetManagers

    this.registry = new AssetRegistry(scene, physics)

  }

  add(inst) {
    this.registry.add(inst)
  }

  find(object) {
    return this.registry.find(object)
  }

  getAll() {
    return this.registry.getAll()
  }

  delete(group) {
    return this.registry.remove(group)
  }

  save() {
    const data = this.getAll().map(inst => ({
      type: inst.assetType,
      position: inst.group.position,
      rotation: inst.group.quaternion
    }))

    localStorage.setItem("world_assets", JSON.stringify(data))
  }

  load() {
    const json = localStorage.getItem("world_assets")
    if (!json) return

    const data = JSON.parse(json)

    for (const item of data) {

      const manager = this.assetManagers[item.type]
      if (!manager) continue

      const inst = manager.spawn(item.position)

      this.add(inst)

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

}

export default AssetSystem
