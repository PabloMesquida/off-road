import * as THREE from 'three/webgpu'
import Game from '../Game'

/* =========================================================
   SIMPLE GIZMO (GEOMETRY-BASED, STABLE)
========================================================= */

class SimpleGizmo {

  constructor({ scene, cameraGetter, domElement, onDragStart, onDragEnd }) {

    this.scene = scene
    this.cameraGetter = cameraGetter
    this.dom = domElement

    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.group.visible = false

    this.object = null
    this.axis = null
    this.dragging = false

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this.plane = new THREE.Plane(new THREE.Vector3(0,1,0),0)
    this.intersection = new THREE.Vector3()
    this.startPoint = new THREE.Vector3()
    this.startPosition = new THREE.Vector3()
    this.startQuaternion = new THREE.Quaternion()
    this.startVector = new THREE.Vector3()

    this.onDragStart = onDragStart
    this.onDragEnd = onDragEnd

    this._createMeshes()

    this.dom.addEventListener('pointerdown', e => this._onPointerDown(e), { capture:true })
    this.dom.addEventListener('pointermove', e => this._onPointerMove(e), { capture:true })
    this.dom.addEventListener('pointerup',   e => this._onPointerUp(e),   { capture:true })
  }

  /* =========================================================
     GEOMETRY
  ========================================================= */

  _createMeshes() {

    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      depthTest: false
    })

    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthTest: false
    })

    const shaftLength = 2.0
    const shaftOffset = shaftLength * 0.5

    // ---------------- X AXIS ----------------

    const xVisualGeo = new THREE.CylinderGeometry(0.01, 0.01, shaftLength, 8)
    const xVisual = new THREE.Mesh(xVisualGeo, lineMat)
    xVisual.rotation.z = -Math.PI / 2
    xVisual.position.x = shaftOffset
    this.group.add(xVisual)

    const xHitGeo = new THREE.CylinderGeometry(0.15, 0.15, shaftLength, 8)
    const xHit = new THREE.Mesh(xHitGeo, hitMat)
    xHit.rotation.z = -Math.PI / 2
    xHit.position.x = shaftOffset
    xHit.userData.axis = 'x'
    this.group.add(xHit)

    // ---------------- Z AXIS ----------------

    const zVisualGeo = new THREE.CylinderGeometry(0.01, 0.01, shaftLength, 8)
    const zVisual = new THREE.Mesh(zVisualGeo, lineMat)
    zVisual.rotation.x = Math.PI / 2
    zVisual.position.z = shaftOffset
    this.group.add(zVisual)

    const zHitGeo = new THREE.CylinderGeometry(0.15, 0.15, shaftLength, 8)
    const zHit = new THREE.Mesh(zHitGeo, hitMat)
    zHit.rotation.x = Math.PI / 2
    zHit.position.z = shaftOffset
    zHit.userData.axis = 'z'
    this.group.add(zHit)

    // ---------------- XZ PLANE ----------------

    const planeVisual = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.8),
      lineMat
    )
    planeVisual.rotation.x = -Math.PI / 2
    planeVisual.position.y = 0.01
    this.group.add(planeVisual)

    const planeHit = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      hitMat
    )
    planeHit.rotation.x = -Math.PI / 2
    planeHit.userData.axis = 'xz'
    this.group.add(planeHit)

    // ---------------- ROTATION Y ----------------

    const ringVisual = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.01, 8, 128),
      lineMat
    )
    ringVisual.rotation.x = Math.PI / 2
    this.group.add(ringVisual)

    const ringHit = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.25, 16, 128),
      hitMat
    )
    ringHit.rotation.x = Math.PI / 2
    ringHit.userData.axis = 'ry'
    this.group.add(ringHit)

    this.gizmoParts = [xHit, zHit, planeHit, ringHit]
  }

  /* =========================================================
     ATTACH / DETACH
  ========================================================= */

  attach(obj) {
    this.object = obj
    this.group.visible = true
    this.group.position.copy(obj.position)
  }

  detach() {
    this.object = null
    this.group.visible = false
  }

  /* =========================================================
     POINTER UTILS
  ========================================================= */

  _getPointer(e) {
    const rect = this.dom.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left)/rect.width)*2-1,
      -((e.clientY - rect.top)/rect.height)*2+1
    )
  }

  /* =========================================================
     EVENTS
  ========================================================= */

  _onPointerDown(e) {

    if (!this.object) return

    this._getPointer(e)

    const cam = this.cameraGetter()
    this.raycaster.setFromCamera(this.pointer, cam)

    const hit = this.raycaster.intersectObjects(this.gizmoParts, true)[0]
    if (!hit) return

    e.preventDefault()
    e.stopImmediatePropagation()

    this.axis = hit.object.userData.axis
    this.dragging = true

    this.plane.constant = -this.object.position.y

    this.raycaster.ray.intersectPlane(this.plane, this.startPoint)
    this.startPosition.copy(this.object.position)
    this.startQuaternion.copy(this.object.quaternion)

    if (this.axis === 'ry') {
      this.startVector.copy(this.startPoint)
        .sub(this.object.position)
        .setY(0)
        .normalize()
    }

    this.onDragStart?.()
  }

  _onPointerMove(e) {

    if (!this.dragging || !this.axis) return

    e.preventDefault()
    e.stopImmediatePropagation()

    this._getPointer(e)

    const cam = this.cameraGetter()
    this.raycaster.setFromCamera(this.pointer, cam)
    this.raycaster.ray.intersectPlane(this.plane, this.intersection)

    if (!this.intersection) return

    if (this.axis === 'x') {
      this.object.position.x = this.intersection.x
    }

    if (this.axis === 'z') {
      this.object.position.z = this.intersection.z
    }

    if (this.axis === 'xz') {
      this.object.position.x = this.intersection.x
      this.object.position.z = this.intersection.z
    }

    if (this.axis === 'ry') {
      const current = new THREE.Vector3()
        .subVectors(this.intersection, this.object.position)
        .setY(0)
        .normalize()

      if (current.lengthSq() < 0.0001) return

      const cross = this.startVector.x * current.z - this.startVector.z * current.x
      const dot = THREE.MathUtils.clamp(this.startVector.dot(current), -1, 1)
      const angle = -Math.atan2(cross, dot)

      const q = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0,1,0), angle)

      this.object.quaternion
        .copy(this.startQuaternion)
        .multiply(q)
    }

    this.group.position.copy(this.object.position)
  }

  _onPointerUp(e) {

    if (!this.dragging) return

    e.preventDefault()
    e.stopImmediatePropagation()

    this.dragging = false
    this.axis = null

    this.onDragEnd?.()
  }

  dispose() {
    this.scene.remove(this.group)
  }
}

/* =========================================================
   MANAGER WRAPPER
========================================================= */

export default class TransformGizmoManager {

  constructor({ scene, cameraGetter, domElement, inputsEvents, onChangeKinematic, onDeleteAsset }) {

    this.game = new Game()
    this.scene = scene
    this.cameraGetter = cameraGetter
    this.domElement = domElement
    this.inputsEvents = inputsEvents
    this.onChangeKinematic = onChangeKinematic
    this.onDeleteAsset = onDeleteAsset

    this.gizmo = null
    this.selectedAsset = null
    this.isDragging = false

    this.inputsEvents?.on('delete', (isDown)=>{
      if (!isDown) return
      if (!this.selectedAsset) return
      this.onDeleteAsset?.(this.selectedAsset)
    })
  }

  create() {
    if (this.gizmo) return

    this.gizmo = new SimpleGizmo({
      scene:this.scene,
      cameraGetter:this.cameraGetter,
      domElement:this.domElement,
      onDragStart:()=>{
        this.isDragging = true
        this.onChangeKinematic?.(true,this.selectedAsset)
      },
      onDragEnd:()=>{
        this.isDragging = false
        this.onChangeKinematic?.(false,this.selectedAsset)
      }
    })
  }

  attach(object) {
    this.selectedAsset = object
    if (!this.gizmo) this.create()
    this.gizmo.attach(object)
  }

  detach() {
    this.selectedAsset = null
    this.gizmo?.detach()
  }

  dispose() {
    this.gizmo?.dispose()
    this.gizmo = null
    this.selectedAsset = null
    this.isDragging = false
  }

  get dragging(){
    return this.isDragging
  }
}