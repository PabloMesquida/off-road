import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import * as RAPIER from '@dimforge/rapier3d-compat'
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

    this.cargoBoxes = []
    this.attachedBoxes = []

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

    // Color e intensidad son uniforms: cambiar el estado no recompila el shader
    if (on) {
      this.greenLightMaterial.setIntensity(4.0)
      this.greenLightMaterial.setColor(0x00ff88)
    } else {
      this.greenLightMaterial.setIntensity(0)
      this.greenLightMaterial.setColor(0x0a3d2a)
    }
  }

  setRedLight(on = true) {
    if (!this.redLightMaterial) return
    this.redLightMaterial.setIntensity(on ? 8.0 : 0)
  }

  setState(state) {
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

    const rotY = -Math.PI/2

    // La grilla se define en el espacio local de la zona (sobre la plataforma) y se pasa a mundo
    // con la transformación del grupo: así respeta la rotación de la zona. Con rotación 0 da
    // exactamente las mismas posiciones que antes.
    this.group.updateMatrixWorld(true)
    const zoneRotY = this.group.rotation.y

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

      const offset = new THREE.Vector3(
        -2.5 + localX * cos - localZ * sin,
        0.1,
        -2.0 + localX * sin + localZ * cos
      )

      const world = this.group.localToWorld(offset)

      // ─────────────────────────────
      // SPAWN
      // ─────────────────────────────

      const inst = manager.spawn(
        { x: world.x, y: world.y, z: world.z },
        zoneRotY + rotY
      )

      this.cargoBoxes.push(inst)
      
      inst.group.userData.draggable = true
      inst.group.userData.assetInstance = inst
      inst.group.userData.cargoZone = this
    }
  }

  // Las cajas no están en el AssetRegistry: se eliminan junto con la zona
  removeCargoBoxes() {
    this.cargoBoxes.forEach(box => {
      if (box.physicsEntity) this.physics?.removeEntity?.(box.physicsEntity)
      this.scene?.remove(box.group)
    })

    this.cargoBoxes = []
    this.attachedBoxes = []
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

  // Prueba en el espacio local de la zona: respeta su rotación (con rotación 0 equivale a getBounds)
  isInside(position) {
    const pos = this.group.position
    const angle = this.group.rotation.y
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const dx = position.x - pos.x
    const dz = position.z - pos.z

    const localX = dx * cos - dz * sin
    const localZ = dx * sin + dz * cos

    return Math.abs(localX) <= this.width * 0.5 && Math.abs(localZ) <= this.depth * 0.5
  }

  setBoxesKinematic() {
    this.attachedBoxes = []

    this.cargoBoxes.forEach(box => {

      if (!box.body) return

      const pos = box.group.position

      if (!this.isInside(pos)) return

      box.body.setBodyType(
        RAPIER.RigidBodyType.KinematicPositionBased,
        true
      )

      box.localOffset = this.group.worldToLocal(
        box.group.position.clone()
      )

      box.localQuat =
        this.group.quaternion
          .clone()
          .invert()
          .multiply(
            box.group.quaternion.clone()
          )

      this.attachedBoxes.push(box)
    })
  }

  restoreBoxesDynamic() {
    this.attachedBoxes.forEach(box => {

      if (!box.body) return

      box.body.setBodyType(
        RAPIER.RigidBodyType.Dynamic,
        true
      )

      box.body.setLinvel(
        { x: 0, y: 0, z: 0 },
        true
      )

      box.body.setAngvel(
        { x: 0, y: 0, z: 0 },
        true
      )

      box.body.wakeUp()

      delete box.localOffset
      delete box.localQuat
      
    })

    this.attachedBoxes = []
  }

  updateAttachedBoxes() {
    this.attachedBoxes.forEach(box => {

      if (!box.localOffset) return
      if (!box.localQuat) return

      const worldPos = this.group.localToWorld(
        box.localOffset.clone()
      )

      const worldQuat =
        this.group.quaternion
          .clone()
          .multiply(box.localQuat)

      box.body.setNextKinematicTranslation({
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z
      })

      box.body.setNextKinematicRotation({
        x: worldQuat.x,
        y: worldQuat.y,
        z: worldQuat.z,
        w: worldQuat.w
      })
    })
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

    // clone(true) comparte geometrías (y materiales no mapeados) con el GLB original:
    // solo liberamos los recursos que creó esta zona.
    const shared = new Set()
    this.resources?.items?.[this.resourceName]?.scene?.traverse((child) => {
      if (!child.isMesh) return
      shared.add(child.geometry)
      shared.add(child.material)
    })

    this.group?.traverse((child) => {
      if (child.geometry && !shared.has(child.geometry)) child.geometry.dispose()
      if (child.material && !shared.has(child.material)) child.material.dispose()
    })

    this.group = null
    this.mesh = null
    this.model = null
  }
}

export default CargoZone