import Vehicle from '../vehicle/Vehicle.js'

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
  }
}

export default VehicleSystem