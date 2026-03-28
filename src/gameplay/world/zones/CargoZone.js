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
    createCollider = true,
    collisionGroup = 'editor'
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
    this.collisionGroup = collisionGroup

    this.modelOffset = { x: 0, y: 0, z: 0.35 }
    this.colliderOffset = { x: 0, y: 0, z: -1.8 }

    this.group = new THREE.Group()
    this.group.name = 'cargoZone'

    this.assetType = 'cargoZone'
    this.physicsEntity = null

    this.createVisual()
    this.createModel()

    this.setRotationY(rotationY)
    this.setPosition(position)

    if (this.createColliderEnabled) {
      this.createCollider()
    }

    this.scene.add(this.group)

    this.group.userData.zone = this
    this.group.userData.type = 'cargoZone'
    this.group.userData.assetType = 'cargoZone'
    this.group.userData.assetInstance = this
  }

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
    this.group.add(mesh)
  }

  createModel() {
    const resource = this.resources?.items?.[this.resourceName]

    if (!resource?.scene) {
      console.warn(`⚠ ${this.resourceName} GLB no cargado en Resources`)
      return
    }

    const model = resource.scene.clone(true)

    const box = new THREE.Box3().setFromObject(model)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    // model.position.sub(center)

    model.scale.setScalar(1.25)
    model.position.set(
      this.modelOffset.x,
      this.modelOffset.y,
      this.modelOffset.z
    )

    this.model = model
    this.group.add(model)
  }

  createCollider() {
    if (!this.physics) return

    const halfX = this.width * 0.47
    const halfZ = this.depth * 0.23
    const height = 0.25

    this.physicsEntity = this.physics.addEntity({
      type: 'fixed',
      position: {
        x: this.group.position.x,
        y: this.group.position.y,
        z: this.group.position.z
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0,
        w: 1
      },
      colliders: [
        {
          shape: 'cuboid',
          parameters: [halfX, height, halfZ],
          offset: this.colliderOffset, // 🔑 LA CLAVE
          collisionGroup: this.collisionGroup
        }
      ]
    }, this.group)
  }

  setPosition({ x, y, z }) {
    this.group.position.set(x, y, z)

    const body = this.body
    if (body?.setTranslation) {

      const offset = new THREE.Vector3(
        this.colliderOffset.x,
        this.colliderOffset.y,
        this.colliderOffset.z
      )

      offset.applyQuaternion(this.group.quaternion)

      body.setTranslation({
        x: x + offset.x,
        y: y + offset.y,
        z: z + offset.z
      }, true)
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

      const offset = new THREE.Vector3(
        this.colliderOffset.x,
        this.colliderOffset.y,
        this.colliderOffset.z
      )

      offset.applyQuaternion(q)

      body.setRotation(q, true)

      const pos = this.group.position

      body.setTranslation({
        x: pos.x + offset.x,
        y: pos.y + offset.y,
        z: pos.z + offset.z
      }, true)
    }
  }

  getPosition() {
    return this.group.position
  }

  get body() {
    return this.physicsEntity?.physical?.body || null
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