import * as THREE from 'three/webgpu'
import AssetRegistry from "../assets/AssetRegistry.js"

class AssetSystem {

  constructor({ scene, physics, assetManagers, resources }) {

    this.scene = scene
    this.physics = physics
    this.assetManagers = assetManagers
    this.resources = resources
    this.onZoneRemoved = null

    this.registry = new AssetRegistry(scene, physics, {
      onZoneRemoved: (type) => {
        if (this.onZoneRemoved) {
          this.onZoneRemoved(type)
        }
      }
    })
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

      const r = item.rotation

      const q = Array.isArray(r)
        ? new THREE.Quaternion(r[0], r[1], r[2], r[3])
        : new THREE.Quaternion(r.x, r.y, r.z, r.w)

      if (item.type === 'cargoZone') {
        const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ')
        const inst = manager.spawn(item.position, euler.y)
        this.add(inst)
        continue
      }

      const inst = manager.spawn(item.position)
      this.add(inst)

      inst.group.quaternion.copy(q)

      if (inst.body) {
        inst.body.setRotation({
          x: q.x,
          y: q.y,
          z: q.z,
          w: q.w
        }, true)
      }
    }
  }

  canPlace(type) {
    if (type === 'cargoZone') {
      return !this.getAll().some(a => a.assetType === 'cargoZone')
    }
    return true
  }

}

export default AssetSystem