import * as THREE from 'three/webgpu'
import Game from '../../Game.js'
import { GridNodeMaterial } from '../../Materials/GridNodeMaterial.js'

class Floor{
  constructor(){
    this.game = new Game()

    this.floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      GridNodeMaterial.fromPreset()
    )
    this.floorMesh.visible = true
    this.floorMesh.geometry.rotateX(-Math.PI / 2)


    this.floorGroup = new THREE.Object3D()
    const halfHeight = 0.2
    this.floorMesh.position.set(0, halfHeight, 0)
    this.floorGroup.add(this.floorMesh)

    this.game.physics.addEntity({
      type: 'fixed',
      position: { x:0, y:0, z:0},
      colliders: [ { shape: 'cuboid', parameters: [10, 0.2, 10] }]
    }, this.floorGroup)   
  }

}

export default Floor