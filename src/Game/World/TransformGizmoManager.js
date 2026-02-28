import * as THREE from 'three/webgpu'
import Game from '../Game'

/* =========================================================
   SIMPLE GIZMO (GEOMETRY-BASED, con hover por parte)
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

    this.colors = {
      default: new THREE.Color(0xa16602),
      hover:   new THREE.Color(0xffff00),
      active:  new THREE.Color(0xff0051)
    }

    // estados hover/active actuales
    this._hoverAxis = null
    this._activeAxis = null

    this._createMeshes()

    // listeners
    this.dom.addEventListener('pointerdown', e => this._onPointerDown(e), { capture:true })
    this.dom.addEventListener('pointermove', e => this._onPointerMove(e), { capture:true })
    this.dom.addEventListener('pointerup',   e => this._onPointerUp(e),   { capture:true })
  }

  /* =========================================================
     GEOMETRY (guardamos referencias visuales para hover)
  ========================================================= */

  _createMeshes() {

    // materiales base (cada visual tendrá su propia instancia para poder colorear)
    const baseLineMat = () => new THREE.MeshBasicMaterial({
      color: this.colors.default.clone(),
      depthTest: false,
      depthWrite: false
    })

    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false
    })

    const ringRadius = 1.5
    const planeSize = 0.5
    const planeHalf = planeSize * 0.5
    const gap = 0.25

    const shaftLength = ringRadius - (planeHalf + gap)
    const shaftOffset = planeHalf + gap + shaftLength * 0.5

    // ---------------- X AXIS ----------------
    this.xVisual = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, shaftLength, 8), baseLineMat())
    this.xVisual.rotation.z = -Math.PI / 2
    this.xVisual.position.x = shaftOffset
    this.group.add(this.xVisual)

    const xHit = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, shaftLength, 8), hitMat)
    xHit.rotation.z = -Math.PI / 2
    xHit.position.x = shaftOffset
    xHit.userData.axis = 'x'
    this.group.add(xHit)

    // ---------------- Z AXIS ----------------
    this.zVisual = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, shaftLength, 8), baseLineMat())
    this.zVisual.rotation.x = Math.PI / 2
    this.zVisual.position.z = shaftOffset
    this.group.add(this.zVisual)

    const zHit = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, shaftLength, 8), hitMat)
    zHit.rotation.x = Math.PI / 2
    zHit.position.z = shaftOffset
    zHit.userData.axis = 'z'
    this.group.add(zHit)

    // ---------------- XZ PLANE (solo bordes) ----------------
    const half = planeSize * 0.5

    const squarePoints = [
      new THREE.Vector3(-half, 0.01, -half),
      new THREE.Vector3( half, 0.01, -half),

      new THREE.Vector3( half, 0.01, -half),
      new THREE.Vector3( half, 0.01,  half),

      new THREE.Vector3( half, 0.01,  half),
      new THREE.Vector3(-half, 0.01,  half),

      new THREE.Vector3(-half, 0.01,  half),
      new THREE.Vector3(-half, 0.01, -half),
    ]

    const squareGeo = new THREE.BufferGeometry().setFromPoints(squarePoints)
    this.planeBorder = new THREE.LineSegments(squareGeo, baseLineMat())
    this.group.add(this.planeBorder)

    const planeHit = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize + 0.4, planeSize + 0.4),
      hitMat
    )
    planeHit.rotation.x = -Math.PI / 2
    planeHit.userData.axis = 'xz'
    this.group.add(planeHit)

    // ---------------- ROTATION Y ----------------
    this.ringVisual = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.01, 8, 128), baseLineMat())
    this.ringVisual.rotation.x = Math.PI / 2
    this.group.add(this.ringVisual)

    const ringHit = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.25, 16, 128), hitMat)
    ringHit.rotation.x = Math.PI / 2
    ringHit.userData.axis = 'ry'
    this.group.add(ringHit)

    // partes raycastables = HIT meshes (no los visuals)
    this.gizmoParts = [xHit, zHit, planeHit, ringHit]

    this.group.renderOrder = 999
  }

  /* helpers para hover / active */
  _clearAllVisualColors() {
    // reset a default
    if (this.xVisual) this.xVisual.material.color.copy(this.colors.default)
    if (this.zVisual) this.zVisual.material.color.copy(this.colors.default)
    if (this.ringVisual) this.ringVisual.material.color.copy(this.colors.default)
    if (this.planeBorder) this.planeBorder.material.color.copy(this.colors.default)
  }

  _setHover(axis) {
    if (this._hoverAxis === axis) return
    this._hoverAxis = axis
    // si hay active, no sobreescribimos active (active tiene prioridad)
    if (this._activeAxis) return

    this._clearAllVisualColors()
    switch(axis) {
      case 'x': if (this.xVisual) this.xVisual.material.color.copy(this.colors.hover); break
      case 'z': if (this.zVisual) this.zVisual.material.color.copy(this.colors.hover); break
      case 'ry': if (this.ringVisual) this.ringVisual.material.color.copy(this.colors.hover); break
      case 'xz': if (this.planeBorder) this.planeBorder.material.color.copy(this.colors.hover); break
      default: break
    }
    this.dom.style.cursor = 'pointer'
  }

  _clearHover() {
    if (!this._hoverAxis) return
    this._hoverAxis = null
    if (this._activeAxis) return
    this._clearAllVisualColors()
    this.dom.style.cursor = ''
  }

  _setActive(axis) {
    this._activeAxis = axis
    this._clearAllVisualColors()
    switch(axis) {
      case 'x': if (this.xVisual) this.xVisual.material.color.copy(this.colors.active); break
      case 'z': if (this.zVisual) this.zVisual.material.color.copy(this.colors.active); break
      case 'ry': if (this.ringVisual) this.ringVisual.material.color.copy(this.colors.active); break
      case 'xz': if (this.planeBorder) this.planeBorder.material.color.copy(this.colors.active); break
      default: break
    }
    this.dom.style.cursor = 'grabbing'
  }

  _clearActive() {
    if (!this._activeAxis) return
    this._activeAxis = null
    this._clearAllVisualColors()
    // si había hover, restaurarlo
    if (this._hoverAxis) this._setHover(this._hoverAxis)
    else this.dom.style.cursor = ''
  }

  /* =========================================================
     ATTACH / DETACH
  ========================================================= */

  attach(obj) {
    this.object = obj
    if (!obj) return

    obj.updateMatrixWorld(true)

    // bounding box WORLD
    const box = new THREE.Box3().setFromObject(obj)
    const minY = box.min.y
    const center = box.getCenter(new THREE.Vector3())

    const objectWorldPos = new THREE.Vector3()
    obj.getWorldPosition(objectWorldPos)

    this.groundOffset = objectWorldPos.y - minY

    const eps = 0.01
    this.group.position.set(center.x, minY + eps, center.z)

    this.plane.constant = -(minY + eps)

    // tamaño fijo en mundo (no escalar por asset)
    this.group.scale.setScalar(1)

    // reset colores al attach
    this._clearAllVisualColors()

    this.group.visible = true
  }

  detach() {
    this.object = null
    this.group.visible = false
    this._hoverAxis = null
    this._activeAxis = null
    this.dom.style.cursor = ''
  }

  /* =========================================================
     POINTER UTIL
  ========================================================= */

  _getPointer(e) {
    const rect = this.dom.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left)/rect.width)*2-1,
      -((e.clientY - rect.top)/rect.height)*2+1
    )
  }

  /* =========================================================
     EVENTS (hover por cada parte)
  ========================================================= */

  _onPointerDown(e) {
    if (!this.object) return

    this._getPointer(e)
    const cam = this.cameraGetter?.()
    if (!cam) return

    this.raycaster.setFromCamera(this.pointer, cam)
    const intersects = this.raycaster.intersectObjects(this.gizmoParts, true)

    if (!intersects.length) {
      // No tocaste el gizmo → NO bloquear evento
      return
    }

    const hit = intersects[0]
    this.axis = hit.object.userData.axis || hit.object.parent?.userData?.axis
    if (!this.axis) return

    // BLOQUEAMOS eventos del DOM (ahora sí)
    e.preventDefault()
    e.stopImmediatePropagation()

    this.dragging = true

    // marcar activo (cambia color)
    this._setActive(this.axis)

    // fijar plano al "suelo"
    const eps = 0.01
    const objWorldPos = new THREE.Vector3()
    this.object.getWorldPosition(objWorldPos)

    const minY = objWorldPos.y - (this.groundOffset ?? 0)
    this.plane.constant = -(minY + eps)

    // punto de inicio en plano (world)
    this.raycaster.ray.intersectPlane(this.plane, this.startPoint)

    // guardar state inicial world (pos/quaternion)
    this.startWorldPosition = new THREE.Vector3()
    this.object.getWorldPosition(this.startWorldPosition)
    this.startPosition.copy(this.startWorldPosition)

    this.startQuaternion = new THREE.Quaternion()
    this.object.getWorldQuaternion(this.startQuaternion)

    if (this.axis === 'ry') {
      this.startVector.copy(this.startPoint)
        .sub(this.object.getWorldPosition(new THREE.Vector3()))
        .setY(0)
        .normalize()
    }

    this.dom.setPointerCapture?.(e.pointerId)

    this.onDragStart?.()
  }

  _onPointerMove(e) {
    if (!this.object) return

    this._getPointer(e)

    const cam = this.cameraGetter?.()
    if (!cam) return

    this.raycaster.setFromCamera(this.pointer, cam)

    // HOVER (si no estamos arrastrando)
    if (!this.dragging) {
      const intersects = this.raycaster.intersectObjects(this.gizmoParts, true)
      if (intersects.length) {
        const a = intersects[0].object.userData.axis || intersects[0].object.parent?.userData?.axis
        if (a) {
          this._setHover(a)
        } else {
          this._clearHover()
        }
      } else {
        this._clearHover()
      }
      return
    }

    // === DRAG MODE ===
    if (!this.axis) return

    e.preventDefault()
    e.stopImmediatePropagation()

    this.raycaster.ray.intersectPlane(this.plane, this.intersection)
    if (!this.intersection) return

    if (this.axis === 'x' || this.axis === 'z') {
      const delta = new THREE.Vector3().subVectors(this.intersection, this.startPoint)
      const dir = this.axis === 'x' ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,0,1)
      const amount = delta.dot(dir)
      const newWorldPos = new THREE.Vector3().copy(this.startWorldPosition).addScaledVector(dir, amount)
      newWorldPos.y = this.startWorldPosition.y

      const localPos = newWorldPos.clone()
      if (this.object.parent) this.object.parent.worldToLocal(localPos)

      this.object.position.copy(localPos)

      const minY = newWorldPos.y - (this.groundOffset ?? 0)
      const eps = 0.01
      this.group.position.set(newWorldPos.x, minY + eps, newWorldPos.z)
    }
    else if (this.axis === 'ry') {
      const current = new THREE.Vector3()
        .subVectors(this.intersection, this.object.getWorldPosition(new THREE.Vector3()))
        .setY(0)
        .normalize()

      if (current.lengthSq() < 0.000001) return

      const crossY = this.startVector.x * current.z - this.startVector.z * current.x
      const dot = Math.max(-1, Math.min(1, this.startVector.dot(current)))
      const angle = -Math.atan2(crossY, dot)

      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), angle)

      if (this.object.parent) {
        const newWorldQuat = new THREE.Quaternion().copy(this.startQuaternion).multiply(q)
        const parentWorldQuat = new THREE.Quaternion()
        this.object.parent.getWorldQuaternion(parentWorldQuat)
        const parentWorldQuatInv = parentWorldQuat.clone().invert()
        const localQuat = newWorldQuat.clone().premultiply(parentWorldQuatInv)
        this.object.quaternion.copy(localQuat)
      } else {
        this.object.quaternion.copy(this.startQuaternion).multiply(q)
      }
    }
    else if (this.axis === 'xz') {
      const delta = new THREE.Vector3().subVectors(this.intersection, this.startPoint)
      const newWorldPos = new THREE.Vector3().copy(this.startWorldPosition).add(delta)
      newWorldPos.y = this.startWorldPosition.y

      const localPos = newWorldPos.clone()
      if (this.object.parent) this.object.parent.worldToLocal(localPos)

      this.object.position.copy(localPos)

      const minY = newWorldPos.y - (this.groundOffset ?? 0)
      const eps = 0.01
      this.group.position.set(newWorldPos.x, minY + eps, newWorldPos.z)
    }
  }

  _onPointerUp(e) {
    if (!this.dragging) return

    e.preventDefault()
    e.stopImmediatePropagation()

    this.dom.releasePointerCapture?.(e.pointerId)

    this.dragging = false
    this.axis = null

    // limpiar active + restaurar hover si aplica
    this._clearActive()
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