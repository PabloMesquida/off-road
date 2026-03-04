import * as THREE from 'three/webgpu'

export function createSimpleGizmoMeshes(gizmo) {
  const baseLineMat = () => new THREE.MeshBasicMaterial({
    color: gizmo.colors.default.clone(),
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
  gizmo.xVisual = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, shaftLength, 8),
    baseLineMat()
  )

  gizmo.xVisual.rotation.z = -Math.PI / 2
  gizmo.xVisual.position.x = shaftOffset
  gizmo.group.add(gizmo.xVisual)

  const xHit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, shaftLength, 8),
    hitMat
  )

  xHit.rotation.z = -Math.PI / 2
  xHit.position.x = shaftOffset
  xHit.userData.axis = 'x'
  gizmo.group.add(xHit)

  // ---------------- Z AXIS ----------------
  gizmo.zVisual = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, shaftLength, 8),
    baseLineMat()
  )

  gizmo.zVisual.rotation.x = Math.PI / 2
  gizmo.zVisual.position.z = shaftOffset
  gizmo.group.add(gizmo.zVisual)

  const zHit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, shaftLength, 8),
    hitMat
  )

  zHit.rotation.x = Math.PI / 2
  zHit.position.z = shaftOffset
  zHit.userData.axis = 'z'
  gizmo.group.add(zHit)

  // ---------------- XZ PLANE ----------------
  const half = planeSize * 0.5

  const squarePoints = [
    new THREE.Vector3(-half, 0.01, -half),
    new THREE.Vector3(half, 0.01, -half),

    new THREE.Vector3(half, 0.01, -half),
    new THREE.Vector3(half, 0.01, half),

    new THREE.Vector3(half, 0.01, half),
    new THREE.Vector3(-half, 0.01, half),

    new THREE.Vector3(-half, 0.01, half),
    new THREE.Vector3(-half, 0.01, -half),
  ]

  const squareGeo = new THREE.BufferGeometry().setFromPoints(squarePoints)
  gizmo.planeBorder = new THREE.LineSegments(squareGeo, baseLineMat())
  gizmo.group.add(gizmo.planeBorder)

  const planeHit = new THREE.Mesh(
    new THREE.PlaneGeometry(planeSize + 0.4, planeSize + 0.4),
    hitMat
  )

  planeHit.rotation.x = -Math.PI / 2
  planeHit.userData.axis = 'xz'
  gizmo.group.add(planeHit)

  // ---------------- ROTATION Y ----------------
  gizmo.ringVisual = new THREE.Mesh(
    new THREE.TorusGeometry(ringRadius, 0.01, 8, 128),
    baseLineMat()
  )

  gizmo.ringVisual.rotation.x = Math.PI / 2
  gizmo.group.add(gizmo.ringVisual)

  const ringHit = new THREE.Mesh(
    new THREE.TorusGeometry(ringRadius, 0.25, 16, 128),
    hitMat
  )

  ringHit.rotation.x = Math.PI / 2
  ringHit.userData.axis = 'ry'
  gizmo.group.add(ringHit)

  gizmo.gizmoParts = [xHit, zHit, planeHit, ringHit]
  gizmo.group.renderOrder = 999
}
