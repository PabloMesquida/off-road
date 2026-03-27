import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import Game from "../../../core/Game.js"
import { computePlaneBorder } from '../../../graphics/tsl/functions/border.js'

class CargoZone {
  constructor({
    scene,
    position = { x: 0, y: 0, z: 0 },
    width = 8,
    depth = 8,
    color = 0xffff00,
    borderWidth = 0.034
  }) {
    this.game = new Game()

    this.resources = this.game.resources
    this.physics = this.game.physics
    this.scene = scene
    this.width = width
    this.depth = depth
    this.group = new THREE.Group()
    this.group.name = 'cargoZone'

    this.createVisual(color, borderWidth)
    this.createModel()
    this.createCollider()

    this.setPosition(position)

    this.scene.add(this.group)
    this.group.userData.zone = this
    this.group.userData.type = 'cargoZone'
  }

  createVisual(color, borderWidth) {
    const geo = new THREE.PlaneGeometry(this.width, this.depth)
    geo.rotateX(-Math.PI / 2)

    const planeSize = TSL.uniform(new THREE.Vector2(this.width, this.depth))
    const borderW = TSL.uniform(borderWidth)
     const colorFinal = TSL.uniform(new THREE.Color(color))

    const material = new THREE.NodeMaterial()

    const border = computePlaneBorder({
      uv: TSL.uv(),
      planeSize,
      borderWidth: borderW
    })

    material.colorNode = TSL.vec3(colorFinal)
    material.opacityNode = TSL.mix(
      TSL.float(0.003), // interior suave
      TSL.float(0.04),  // borde fuerte
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
    const resource = this.resources?.items?.cargoZone

    if (!resource) {
      console.warn('⚠ cargoZone GLB no cargado en Resources')
      return
    }

    const model = resource.scene.clone(true)

    // centrar modelo
    const box = new THREE.Box3().setFromObject(model)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()

    box.getCenter(center)
    box.getSize(size)

    // model.position.sub(center)

    model.scale.setScalar(1.2)

    // levantar un poco
    model.position.y += 0
    model.position.z += 0.3

    this.model = model
    this.group.add(model)
  }

  createCollider() {
    if (!this.physics) return

    const halfX = this.width * 0.5
    const halfZ = this.depth * 0.5
    const height = 0

    this.collider = this.physics.addEntity({
      type: 'cuboid',
      size: {
        x: halfX,
        y: height,
        z: halfZ
      },
      position: this.group.position,
      rotation: this.group.rotation,
      fixed: true,
      userData: {
        type: 'cargoZone'
      }
    })
  }


  setPosition({ x, y, z }) {
    this.group.position.set(x, y, z)
  }

  dispose() {
    if (!this.group) return

    if (this.scene) this.scene.remove(this.group)

    this.group.traverse((child) => {
      child.geometry?.dispose?.()
      child.material?.dispose?.()
    })

    this.group = null
    this.mesh = null
  }
}

export default CargoZone