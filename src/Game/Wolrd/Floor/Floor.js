import * as THREE from 'three/webgpu'
import PolishedConcreteMaterial from '../../Materials/PolishedConcreteMaterial.js'
import { matRotY } from 'tsl-textures/tsl-textures.js'

class Floor{
  constructor(scene, physics, { x = 20, y = 20, z = 0.2 } = {}) {
    this.scene = scene
    this.physics = physics
    this.size = { x, y, z }

    this.setModel()
    this.setPhysics()
  }

  setModel(){
    const { x, y, z } = this.size
    const geometry = new THREE.BoxGeometry(x, y, z)
   // geometry.rotateX(-Math.PI / 2)
    const material = new PolishedConcreteMaterial()
    const floorMesh = new THREE.Mesh(geometry, material)

    const subHeight = 0.5
    const subFloorGeometry = new THREE.BoxGeometry(x, subHeight, z)
    const subFloorMaterial = new THREE.MeshStandardNodeMaterial({ color: '#3c3d40' })
    const subFloorMesh = new THREE.Mesh(subFloorGeometry, subFloorMaterial)
      subFloorMesh.position.set(0, -(y / 2) - (subHeight / 2), 0)
    this.scene.add(subFloorMesh)

    this.floorGroup = new THREE.Object3D()
    floorMesh.position.set(0, 0, 0)
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    this.floorGroup.add(floorMesh)

    this.scene.add(this.floorGroup)
  }

  setPhysics(){
    const { x, y, z } = this.size
    this.physics.addEntity({
      type: 'fixed',
      position: { x:0, y:0, z:0},
      colliders: [ { 
        shape: 'cuboid', 
        parameters: [x * .5, y * .5, z * .5],
        restitution: 0.05,   
        friction: 0.5
      }]
    }, this.floorGroup)   
  }

}

export default Floor