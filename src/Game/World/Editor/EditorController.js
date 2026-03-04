export default class EditorController {
  constructor({
    view,
    floor,
    vehicle,
    placing,
    transformManager,
    tweakpaneUI,
    initialVehiclePosition,
    initialVehicleRotation
  }) {
    this.view = view
    this.floor = floor
    this.vehicle = vehicle
    this.placing = placing
    this.transformManager = transformManager
    this.tweakpaneUI = tweakpaneUI

    this.initialVehiclePosition = initialVehiclePosition
    this.initialVehicleRotation = initialVehicleRotation

    this.isEditing = false
  }

  setEditMode(isEditing) {
    this.isEditing = isEditing

    this.tweakpaneUI?.updateState(isEditing)
    this.view?.setEditableState(isEditing)
    this.view?.setEditMode(isEditing)
    this.floor?.setEditableState?.(isEditing)

    if (isEditing) {
      this._enterEditMode()
    } else {
      this._exitEditMode()
    }
  }

  _enterEditMode() {
    if (this.vehicle?.chassis?.body) {
      const body = this.vehicle.chassis.body

      body.setTranslation(this.initialVehiclePosition, true)
      body.setRotation(this.initialVehicleRotation, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)

      this.vehicle.chassis.mesh.visible = false
      body.setBodyType(1, true) // KinematicPositionBased
    }

    this.transformManager?.create()
  }

  _exitEditMode() {
    if (this.vehicle?.chassis?.body) {
      this.vehicle.chassis.mesh.visible = true
      this.vehicle.chassis.body.setBodyType(0, true) // Dynamic
    }

    this.placing?.disablePlacing()
    this.transformManager?.dispose()
  }
}