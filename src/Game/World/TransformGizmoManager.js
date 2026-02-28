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
    if (!obj) return

    // Asegurarnos de tener matrices world actualizadas
    obj.updateMatrixWorld(true)

    // Bounding box en coordenadas world
    const worldBox = new THREE.Box3().setFromObject(obj)
    const worldCenter = worldBox.getCenter(new THREE.Vector3())
    const minY = worldBox.min.y

    // Guardamos offset entre la posición world del objeto (su referencia) y el minY del bounding
    // Esto nos permite desplazar el gizmo correctamente cuando el objeto se mueva.
    const objectWorldPos = new THREE.Vector3()
    obj.getWorldPosition(objectWorldPos)
    this.groundOffset = objectWorldPos.y - minY

    // Posicionar gizmo en la base (suelo) del objeto
    const eps = 0.01
    this.group.position.set(worldCenter.x, minY + eps, worldCenter.z)

    // Plano de interacción al nivel del suelo del objeto
    this.plane.constant = -(minY + eps)

    // Aseguramos visibilidad
    this.group.visible = true
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

    // fijar plano al "suelo" actual del objeto (ya calculado en attach)
    // plane.constant ya está seteado en attach, pero re-aseguramos en caso de que cambió
    const eps = 0.01
    // obtener posición world actual del objeto (puede haber cambiado)
    const objWorldPos = new THREE.Vector3()
    this.object.getWorldPosition(objWorldPos)

    // recomputar plane.constant usando objWorldPos y groundOffset
    const minY = objWorldPos.y - (this.groundOffset ?? 0)
    this.plane.constant = -(minY + eps)

    // punto de inicio en el plano (world)
    this.raycaster.ray.intersectPlane(this.plane, this.startPoint)

    // Guardamos posición de inicio en WORLD (IMPORTANTE)
    this.startWorldPosition = new THREE.Vector3()
    this.object.getWorldPosition(this.startWorldPosition)
    this.startPosition.copy(this.startWorldPosition)

    // Guardamos quaternion WORLD para rotaciones (usar getWorldQuaternion si el objeto tiene padres)
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
    // Si no estamos draggeando, no hacemos nada y dejamos que el evento fluya
    if (!this.dragging || !this.object || !this.axis) return

    // Solo si estamos en drag bloqueamos propagación
    e.preventDefault()
    e.stopImmediatePropagation()

    this._getPointer(e)

    const cam = this.cameraGetter?.()
    if (!cam) return

    this.raycaster.setFromCamera(this.pointer, cam)
    this.raycaster.ray.intersectPlane(this.plane, this.intersection)
    if (!this.intersection) return

    if (this.axis === 'x' || this.axis === 'z') {
      const delta = new THREE.Vector3().subVectors(this.intersection, this.startPoint)
      const dir = this.axis === 'x'
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 0, 1)

      const amount = delta.dot(dir)

      // newWorldPos es la posición world objetivo para el objeto
      const newWorldPos = new THREE.Vector3()
        .copy(this.startWorldPosition)
        .addScaledVector(dir, amount)

      // Mantener altura inicial (world)
      newWorldPos.y = this.startWorldPosition.y

      // Convertir a local si el objeto tiene parent
      const localPos = newWorldPos.clone()
      if (this.object.parent) {
        this.object.parent.worldToLocal(localPos)
      }

      // Asignar en local
      this.object.position.copy(localPos)

      // Actualizar la posición del gizmo para quedar apoyado en la nueva base del objeto
      const minY = newWorldPos.y - (this.groundOffset ?? 0)
      const eps = 0.01
      this.group.position.set(newWorldPos.x, minY + eps, newWorldPos.z)
    }
    else if (this.axis === 'ry') {
      // Rotación con referencia world (calculada con startQuaternion que guardamos en world)
      const current = new THREE.Vector3()
        .subVectors(this.intersection, this.object.getWorldPosition(new THREE.Vector3()))
        .setY(0)
        .normalize()

      if (current.lengthSq() < 0.000001) return

      const crossY = this.startVector.x * current.z - this.startVector.z * current.x
      const dot = Math.max(-1, Math.min(1, this.startVector.dot(current)))
      const angle = -Math.atan2(crossY, dot)

      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle)

      // Si el objeto tiene parent, debemos aplicar la rotación en el sistema local del objeto.
      // La forma más robusta es convertir startQuaternion (world) a local antes de aplicar y luego escribir local quaternion.
      // Simplificación práctica (funciona si el objeto no tiene rotación de padre compleja): aplicar world quaternion y luego convertir a local.

      // Obtener parent world quaternion inversa si existe
      if (this.object.parent) {
        // newWorldQuat = startWorldQuat * q
        const newWorldQuat = new THREE.Quaternion().copy(this.startQuaternion).multiply(q)

        // convertir newWorldQuat a quaternion local para el objeto
        const parentWorldQuat = new THREE.Quaternion()
        this.object.parent.getWorldQuaternion(parentWorldQuat)
        const parentWorldQuatInv = parentWorldQuat.clone().invert()

        const localQuat = newWorldQuat.clone().premultiply(parentWorldQuatInv)
        this.object.quaternion.copy(localQuat)
      } else {
        // el objeto no tiene parent → simplemente escribir quaternion local
        this.object.quaternion.copy(this.startQuaternion).multiply(q)
      }
    }
    else if (this.axis === 'xz') {
      // free plane drag: delta en world
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