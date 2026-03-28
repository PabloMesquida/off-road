import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import { computePlaneBorder } from '../../../graphics/tsl/functions/border.js'

class CargoZone {
  constructor({
    scene,
    resources,
    physics = null,
    position = { x: 0, y: 0, z: 0 },
    rotationY = 0,
    width = 8,
    depth = 8,
    color = 0xffff00,
    borderWidth = 0.034,
    resourceName = 'cargoZone',
    createCollider = true
  }) {
    this.scene = scene
    this.resources = resources
    this.physics = physics

    this.width = width
    this.depth = depth
    this.color = color
    this.borderWidth = borderWidth
    this.resourceName = resourceName
    this.createColliderEnabled = createCollider

    // offsets locales (🔥 ahora correctos)
    this.modelOffset = { x: 0, y: 0, z: 0.35 }
    this.colliderOffset = { x: 0, y: 0, z: -1.8 }

    this.group = new THREE.Group()
    this.group.name = 'cargoZone'
    
    this.visualRoot = new THREE.Group()
    this.colliderRoot = new THREE.Group()

    this.group.add(this.visualRoot)
    this.group.add(this.colliderRoot)

    this.assetType = 'cargoZone'
    this.physicsEntity = null

    this.createVisual()
    this.createModel()

    // offsets locales
    this.colliderRoot.position.set(
      this.colliderOffset.x,
      this.colliderOffset.y,
      this.colliderOffset.z
    )

    this.setPosition(position)
    this.setRotationY(rotationY)

    if (this.createColliderEnabled) {
      this.createCollider()
    }

    this.scene.add(this.group)

    this.group.userData.zone = this
    this.group.userData.type = 'cargoZone'
    this.group.userData.assetType = 'cargoZone'
    this.group.userData.assetInstance = this
  }

  // ─────────────────────────────
  // VISUAL (plano con borde)
  // ─────────────────────────────

  createVisual() {
    const geo = new THREE.PlaneGeometry(this.width, this.depth)
    geo.rotateX(-Math.PI / 2)

    const planeSize = TSL.uniform(new THREE.Vector2(this.width, this.depth))
    const borderW = TSL.uniform(this.borderWidth)
    const colorFinal = TSL.uniform(new THREE.Color(this.color))

    const material = new THREE.NodeMaterial()

    const border = computePlaneBorder({
      uv: TSL.uv(),
      planeSize,
      borderWidth: borderW
    })

    material.colorNode = TSL.vec3(colorFinal)

    material.opacityNode = TSL.mix(
      TSL.float(0.003),
      TSL.float(0.04),
      border
    )

    material.alphaTestNode = TSL.float(0.001)
    material.transparent = true
    material.depthWrite = false

    const mesh = new THREE.Mesh(geo, material)
    mesh.position.y = 0.02

    this.mesh = mesh
    this.visualRoot.add(mesh)
  }

  // ─────────────────────────────
  // MODELO GLB
  // ─────────────────────────────

  createModel() {
    const resource = this.resources?.items?.[this.resourceName]

    if (!resource?.scene) {
      console.warn(`⚠ ${this.resourceName} GLB no cargado en Resources`)
      return
    }

    const model = resource.scene.clone(true)

    model.traverse((child) => {
      if (!child.isMesh) return

      if (child.material) {
        child.material = child.material.clone()
      }

      child.castShadow = true
      child.receiveShadow = true
    })

    model.scale.setScalar(1.25)

    model.position.set(
      this.modelOffset.x,
      this.modelOffset.y,
      this.modelOffset.z
    )

    this.model = model
    this.visualRoot.add(model)
  }

  // ─────────────────────────────
  // COLLIDER 
  // ─────────────────────────────

  createCollider() {
    if (!this.physics) return

    const halfX = this.width * 0.46
    const halfZ = this.depth * 0.25
    const height = 0.65

    const worldPos = new THREE.Vector3()
    const worldQuat = new THREE.Quaternion()

    this.colliderRoot.getWorldPosition(worldPos)
    this.colliderRoot.getWorldQuaternion(worldQuat)

    this.physicsEntity = this.physics.addEntity({
      type: 'fixed',
      position: {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z
      },
      rotation: {
        x: worldQuat.x,
        y: worldQuat.y,
        z: worldQuat.z,
        w: worldQuat.w
      },
      colliders: [
        {
          shape: 'cuboid',
          parameters: [halfX, height, halfZ]
        }
      ]
    }, this.colliderRoot)
  }

  // ─────────────────────────────
  // TRANSFORM
  // ─────────────────────────────

  setPosition({ x, y, z }) {
    this.group.position.set(x, y, z)

    const body = this.body
    if (body?.setTranslation) {
      body.setTranslation({ x, y, z }, true)
    }
  }

  setRotationY(rotationY = 0) {
    this.group.rotation.y = rotationY

    const body = this.body
    if (body?.setRotation) {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotationY
      )

      body.setRotation({
        x: q.x,
        y: q.y,
        z: q.z,
        w: q.w
      }, true)
    }
  }

  get body() {
    return this.physicsEntity?.physical?.body || null
  }

  // ─────────────────────────────
  // UTILS
  // ─────────────────────────────

  getPosition() {
    return this.group.position
  }

  getBounds() {
    const halfX = this.width * 0.5
    const halfZ = this.depth * 0.5
    const pos = this.group.position

    return {
      xMin: pos.x - halfX,
      xMax: pos.x + halfX,
      zMin: pos.z - halfZ,
      zMax: pos.z + halfZ
    }
  }

  isInside(position) {
    const b = this.getBounds()
    return (
      position.x >= b.xMin &&
      position.x <= b.xMax &&
      position.z >= b.zMin &&
      position.z <= b.zMax
    )
  }

  // ─────────────────────────────
  // CLEANUP
  // ─────────────────────────────

  dispose() {
    if (this.physicsEntity) {
      this.physics?.removeEntity?.(this.physicsEntity)
      this.physicsEntity = null
    }

    if (this.scene && this.group) {
      this.scene.remove(this.group)
    }

    this.group?.traverse((child) => {
      child.geometry?.dispose?.()
      child.material?.dispose?.()
    })

    this.group = null
    this.mesh = null
    this.model = null
  }
}

export default CargoZone