import * as THREE from 'three/webgpu'
import { GridNodeMaterial } from '../../Materials/GridNodeMaterial.js'

class Floor{
  constructor(scene, physics, { width = 20, depth = 20, height = 0.2 } = {}) {
    this.scene = scene
    this.physics = physics
    this.size = { width, depth, height }

    this.setModel()

    this.physics.addEntity({
      type: 'fixed',
      position: { x:0, y:0, z:0},
      colliders: [ { shape: 'cuboid', parameters: [width * .5, height * .5, depth * .5] }]
    }, this.floorGroup)   
  }

  setModel(){
    const { width, depth, height } = this.size
    const geometry = new THREE.PlaneGeometry(width, depth)
    geometry.rotateX(-Math.PI / 2)
    const material = GridNodeMaterial.fromPreset()
    const floorMesh = new THREE.Mesh(geometry, material)

    this.floorGroup = new THREE.Object3D()
    floorMesh.position.set(0, height / 2, 0)
    this.floorGroup.add(floorMesh)

    this.scene.add(this.floorGroup)
  }

}

export default Floor