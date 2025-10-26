import * as THREE from 'three/webgpu'
import PolishedConcreteMaterial from '../../Materials/PolishedConcreteMaterial.js'
// import FloorMaterial from '../../Materials/FloorMaterial.js'
import { GridNodeMaterial } from '../../Materials/GridNodeMaterial.js'

class Floor{
  constructor(scene, physics, { x = 20, y = 0.2, z = 20 } = {}) {
    this.scene = scene
    this.physics = physics
    this.size = { x, y, z }

    this.setModel()
    this.setPhysics()
  }

  setModel(){
    const { x, y, z } = this.size
    const geometry = new THREE.BoxGeometry(x, y, z)

    const material = new PolishedConcreteMaterial()// new FloorMaterial({ color: '#9b9e89' })  // 
  

    // const gridMaterial = GridNodeMaterial.fromPreset('blueprint')
    const floorMesh = new THREE.Mesh(geometry, material)


    const subFloorGeometry = new THREE.PlaneGeometry(x, z)
    const subFloorMaterial =  GridNodeMaterial.fromPreset('dark')
    subFloorMaterial.gridSize = new THREE.Vector2(x, z)
    subFloorMaterial.borderColor = new THREE.Color('#FFFF00')
    subFloorMaterial.borderWidth = 20
    subFloorMaterial.borderOffset = 30
    subFloorMaterial.stripeSize = 1.5
    const subFloorMesh = new THREE.Mesh(subFloorGeometry, subFloorMaterial)
    subFloorGeometry.rotateX(-Math.PI / 2)
    subFloorMaterial.opacity = 0.04
    subFloorMesh.position.set(0, 0.12, 0)
    
 
    this.floorGroup = new THREE.Object3D()
    floorMesh.position.set(0, 0, 0)
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    this.floorGroup.add(subFloorMesh)
    this.floorGroup.add(floorMesh)

    this.scene.add(this.floorGroup)
  }

  setPhysics(){
    const { x, y, z } = this.size
    this.physics.addEntity({
      type: 'kinematic',
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