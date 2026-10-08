import * as THREE from 'three/webgpu'
import Vehicle from '../vehicle/Vehicle.js'

// Esquinas del piso de la caja de carga en coordenadas locales del chasis
// (mismo rectángulo que el collider "PISO PICKUP": offset x 1.2, mitades 1 × 0.9).
// La camioneta (~4.6 m) no entra entera en la mitad libre de la zona (4 m): lo que importa
// para cargar es que la caja esté dentro.
const BED_CORNERS = [
  new THREE.Vector3(0.2, 0, -0.9),
  new THREE.Vector3(0.2, 0, 0.9),
  new THREE.Vector3(2.2, 0, -0.9),
  new THREE.Vector3(2.2, 0, 0.9)
]

const _corner = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()

function isCargoBedInside(zone, chassis) {
  const pos = chassis.body.translation()
  const rot = chassis.body.rotation()
  _quaternion.set(rot.x, rot.y, rot.z, rot.w)

  // Usa la rotación real del coche (antes se asumía alineado al eje X del mundo)
  return BED_CORNERS.every(corner => {
    _corner.copy(corner).applyQuaternion(_quaternion)
    _corner.x += pos.x
    _corner.z += pos.z
    return zone.isInside(_corner)
  })
}

class VehicleSystem {
  constructor({ world }) {
    this.world = world
    this.scene = world.scene
    this.physics = world.game.physics
    this.floor = world.floor

    this.vehicle = null

  }

  init() {
    this.vehicle = new Vehicle(this.scene, this.physics)

    if (this.vehicle?.chassis?.mesh) {
      this.world.initialVehicleRotation.copy(
        this.vehicle.chassis.mesh.quaternion
      )
    }
  }

  updatePhysics(dt) {
    const vehicle = this.vehicle
    if (!vehicle) return

    const safeDt = Math.min(dt, 1 / 60)
    this.physics.world.timestep = safeDt

    if (vehicle.visuals) {
      vehicle.visuals.update(dt)
    }

    if (vehicle.controller) {
      vehicle.controller.update(safeDt)
    }

    this.physics.world.step()

    if (vehicle.controller) {
      vehicle.controller.syncMeshes()
    }

    this.physics.syncEntities()
  }

  getVehicle() {
    return this.vehicle
  }

  getPosition() {
    if (!this.vehicle?.chassis?.body) return null

    const pos = this.vehicle.chassis.body.translation()

    return { x: pos.x, y: pos.y, z: pos.z }
  }

  update() {
    if (!this.vehicle) return
    const pos = this.vehicle.chassis.mesh.position
    const limit = this.floor.getLimit()
    const vel = this.vehicle.chassis.body.linvel()

    const isOutside =
      (Math.abs(pos.x) > limit && Math.sign(vel.x) === Math.sign(pos.x)) ||
      (Math.abs(pos.z) > limit && Math.sign(vel.z) === Math.sign(pos.z))

    this.vehicle.controller.isOutsideLimit = isOutside
    this.vehicle.visuals.isOutsideLimit = isOutside

    const cargoManager = this.world.assetManagers['cargoZone']
  
    if (!cargoManager?.zones?.length) return

    const chassis = this.vehicle.chassis

    cargoManager.zones.forEach(zone => {
      const inside = isCargoBedInside(zone, chassis)

      // evita recalcular estado cada frame
      if (zone._isVehicleInside === inside) return
      zone._isVehicleInside = inside
      if (inside) {
        zone.setState('active')
      } else {
        zone.setState('idle')  
      }
    })
  }
}

export default VehicleSystem