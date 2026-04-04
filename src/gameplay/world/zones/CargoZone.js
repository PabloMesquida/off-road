import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import materialResolver from '../assets/AssetMaterialResolver.js'
import { computePlaneBorder } from '../../../graphics/tsl/functions/border.js'
import LightMaterial from '../../../graphics/materials/vehicle/LightMaterial.js'

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
    resourceName = 'cargoZoneModel',
    materialMapping,
    createCollider = true,
    assetManagers
  }) {
    this.scene = scene
    this.resources = resources
    this.physics = physics

    this.width = width
    this.depth = depth
    this.color = color
    this.borderWidth = borderWidth
    this.resourceName = resourceName
    this.materialMapping = materialMapping
    this.createColliderEnabled = createCollider
    this.assetManagers = assetManagers

    this.modelOffset = { x: 0, y: 0, z: 0.35 }
    this.colliderOffset = { x: 0, y: 0, z: -1.85 }

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

    this.colliderRoot.position.set(
      this.colliderOffset.x,
      this.colliderOffset.y,
      this.colliderOffset.z
    )

    this.setPosition(position)
    this.setRotationY(rotationY)

      this.createCargoBoxes(16)

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
  // MODELO GLB + LIGHT MATERIAL
  // ─────────────────────────────

  createModel() {
    const resource = this.resources?.items?.[this.resourceName]

    if (!resource?.scene) {
      console.warn(`⚠ ${this.resourceName} GLB no cargado en Resources`)
      return
    }

    const model = resource.scene.clone(true)

    // resolver base (PBR + mappings)
    if (this.resources?.assetMaterialResolver) {
      this.resources.assetMaterialResolver.apply(model, this.assetType)
    }

    if (this.materialMapping) {
      materialResolver.applyMaterialMapping(
        model,
        this.materialMapping
      )
    }

    // ───────────────
    // LIGHTS
    // ───────────────

    const greenLightMat = new LightMaterial({
      baseColor: 0x1cd68e,
      intensity: 0,
      maxIntensity: 10.0
    })

    const redLightMat = new LightMaterial({
      baseColor: 0xff0f0f,
      intensity: 0,
      maxIntensity: 10.0
    })

    model.traverse((child) => {
      if (!child.isMesh) return

      const geom = child.geometry

      // UV2 obligatorio
      if (geom?.attributes?.uv && !geom.attributes.uv2) {
        geom.setAttribute(
          'uv2',
          new THREE.BufferAttribute(geom.attributes.uv.array, 2)
        )
      }

      const mat = child.material

      if (mat) {
        // fallback ORM si vino mal del GLB
        if (mat.map && !mat.aoMap) {
          mat.aoMap = mat.map
        }

        // boost AO
        if (mat.aoMap) {
          mat.aoMapIntensity = 1
        }

        mat.needsUpdate = true
      }

      // luces (mantener)
      const tag = child.userData?.tag

      if (tag === 'greenLight') {
        child.material = greenLightMat
      }

      if (tag === 'redLight') {
        child.material = redLightMat
      }

      child.castShadow = true
      child.receiveShadow = true
    })

    // guardar refs para runtime
    this.greenLightMaterial = greenLightMat
    this.redLightMaterial = redLightMat

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
  // CONTROL DE LUCES
  // ─────────────────────────────

  setGreenLight(on = true) {
    if (!this.greenLightMaterial) return

    if (on) {
      this.greenLightMaterial.setIntensity(4.0)

      // color visible
      this.greenLightMaterial.setColor?.(new THREE.Color(0x00ff88))
      this.greenLightMaterial.baseColor?.set?.(0x00ff88)

      // por si el shader usa otra referencia interna
      this.greenLightMaterial.emissiveColor?.set?.(0x00ff88)
      this.greenLightMaterial.emissive?.set?.(0x00ff88)

      this.greenLightMaterial.needsUpdate = true
    } else {
      this.greenLightMaterial.setIntensity(0)

      this.greenLightMaterial.setColor?.(new THREE.Color(0x0a3d2a))
      this.greenLightMaterial.baseColor?.set?.(0x0a3d2a)

      this.greenLightMaterial.emissiveColor?.set?.(0x0a3d2a)
      this.greenLightMaterial.emissive?.set?.(0x0a3d2a)

      this.greenLightMaterial.needsUpdate = true
    }
  }

  setRedLight(on = true) {
    if (!this.redLightMaterial) return
    this.redLightMaterial.setIntensity(on ? 8.0 : 0)
  }

  setState(state) {
    console.log('OK')
    // ejemplo simple
    if (state === 'idle') {
      this.setGreenLight(false)
      this.setRedLight(true)
    }

    if (state === 'active') {
      this.setGreenLight(true)
      this.setRedLight(false)
    }
  }

  // ─────────────────────────────
  // COLLIDER
  // ─────────────────────────────

  createCollider() {
    if (!this.physics) return

    const halfX = this.width * 0.46
    const halfZ = this.depth * 0.2325
    const height = 0.765

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
    })
  }

  createCargoBoxes(count = 5) {
  const manager = this.assetManagers?.['cargoBox']

  if (!manager) {
    console.warn('no cargoBox manager')
    return
  }

  const cols = 2
  const spacing = 0.7

  const basePos = this.group.position
  const rotY = -Math.PI/2

  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    // ─────────────────────────────
    // POSICIÓN LOCAL (grid)
    // ─────────────────────────────

    let localX = (col - 0.5) * spacing
    let localZ = row * spacing

    // ─────────────────────────────
    // ROTAR POSICIÓN (CLAVE)
    // ─────────────────────────────

    const cos = Math.cos(rotY)
    const sin = Math.sin(rotY)

    const worldX = basePos.x - 2.5 + localX * cos - localZ * sin
    const worldZ = basePos.z - 2.0 + localX * sin + localZ * cos

    const y = basePos.y + 0.1

    // ─────────────────────────────
    // SPAWN
    // ─────────────────────────────

    const inst = manager.spawn(
      { x: worldX, y, z: worldZ },
      rotY // 
    )

    inst.group.userData.cargoZone = this
  }
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