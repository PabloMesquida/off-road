export default class EditorController {

  constructor({
    view,
    floor,
    getVehicle,
    placing,
    transformManager,
    tweakpaneUI,
    initialVehiclePosition,
    initialVehicleRotation
  }) {
    this.view = view
    this.floor = floor
    this.getVehicle = getVehicle
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
    const vehicle = this.getVehicle?.()

    if (vehicle?.chassis?.body) {

      const body = vehicle.chassis.body

      body.setTranslation(this.initialVehiclePosition, true)
      body.setRotation(this.initialVehicleRotation, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)

      vehicle.chassis.mesh.visible = false
      body.setBodyType(1, true)
      

    }

    this.transformManager?.create()
  }

  _exitEditMode() {
    const vehicle = this.getVehicle?.()

    this.floor?.removeStartZoneCollider?.()

    if (vehicle?.chassis?.body) {
      const body = vehicle.chassis.body

      // limpiar estado físico
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)

      // forzar wake + reset
      body.setTranslation(body.translation(), true)
      body.setRotation(body.rotation(), true)

      // ahora sí volver a dynamic
      body.setBodyType(0, true)

      vehicle.chassis.mesh.visible = true
    }

    this.placing?.disablePlacing()
    this.transformManager?.dispose()
  }
}