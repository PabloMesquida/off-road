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
    const inst = this.registry.remove(group)

    // El manager de zonas guarda su propia lista (la recorre VehicleSystem cada frame)
    if (inst?.assetType === 'cargoZone') {
      const zoneManager = this.assetManagers['cargoZone']
      if (zoneManager?.zones) zoneManager.zones = zoneManager.zones.filter(z => z !== inst)
    }

    return inst
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

  hasCargoZone(ignoreGroup = null) {
    return this.getAll().some(a => {
      if (a.assetType !== 'cargoZone') return false
      if (ignoreGroup && a.group === ignoreGroup) return false
      return true
    })
  }

  isInsideCargoZone(position, ignoreGroup = null) {
    return this.getAll().some(a => {
      if (a.assetType !== 'cargoZone') return false
      if (ignoreGroup && a.group === ignoreGroup) return false
      return typeof a.isInside === 'function' && a.isInside(position)
    })
  }

  canPlace(type, position = null, ignoreGroup = null) {
    if (type === 'cargoZone') {
      return !this.hasCargoZone(ignoreGroup)
    }

    if (position && this.isInsideCargoZone(position, ignoreGroup)) {
      return false
    }

    return true
  }
}

export default AssetSystem