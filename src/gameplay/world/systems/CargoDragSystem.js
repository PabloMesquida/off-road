import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'

export default class CargoDragSystem {
  constructor({ scene, camera }) {
    this.scene = scene
    this.camera = camera

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.dragHeight = 0

    this.dragPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      0
    )

    this.dragPoint = new THREE.Vector3()

    this.currentDrag = null

    this._bindEvents()
  }

  destroy() {
    window.removeEventListener('pointerdown', this._onPointerDown)
    window.removeEventListener('pointermove', this._onPointerMove)
    window.removeEventListener('pointerup', this._onPointerUp)
  }

  update() {
    if (!this.currentDrag) return

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const hit = this.raycaster.ray.intersectPlane(
      this.dragPlane,
      this.dragPoint
    )

    if (!hit) return

    const { body } = this.currentDrag

    body.setNextKinematicTranslation({
      x: this.dragPoint.x,
      y: this.dragPoint.y,
      z: this.dragPoint.z
    })  

    body.setLinvel(
      {
        x: 0,
        y: 0,
        z: 0
      },
      true
    )

    body.setAngvel(
      {
        x: 0,
        y: 0,
        z: 0
      },
      true
    )
  }

  _bindEvents() {
    this._onPointerDown = this._handlePointerDown.bind(this)
    this._onPointerMove = this._handlePointerMove.bind(this)
    this._onPointerUp = this._handlePointerUp.bind(this)

    window.addEventListener('pointerdown', this._onPointerDown)
    window.addEventListener('pointermove', this._onPointerMove)
    window.addEventListener('pointerup', this._onPointerUp)
  }

  _handlePointerMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  _handlePointerDown(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    )

    if (!intersects.length) return

    for (const hit of intersects) {
      let obj = hit.object

      while (obj) {
        if (obj.userData?.draggable) {
          this._tryStartDrag(obj)
          return
        }

        obj = obj.parent
      }
    }
  }

  _tryStartDrag(obj) {
    const inst = obj.userData.assetInstance

    if (!inst) return

    const zone = obj.userData.cargoZone

    if (!zone) return

    if (!zone._isVehicleInside) return

    const body = inst.body

    const pos = body.translation()
    this.dragHeight = pos.y + 1

    this.dragPlane.set(
      new THREE.Vector3(0, 1, 0),
      -this.dragHeight
    )

    if (!body) return

    // kinematicPosition
    // body.setBodyType(1, true)
    body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)

    body.setLinvel(
      {
        x: 0,
        y: 0,
        z: 0
      },
      true
    )

    body.setAngvel(
      {
        x: 0,
        y: 0,
        z: 0
      },
      true
    )

    this.currentDrag = {
      obj,
      body,
      zone
    }
  }

  _handlePointerUp() {
    if (!this.currentDrag) return

    const { body } = this.currentDrag

    // dynamic
    // body.setBodyType(0, true)
    body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)

    this.currentDrag = null
  }
}