import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import CubeTest from './CubeTest/CubeTest.js'
import Floor from './Floor/Floor.js'

class World{
  constructor(){
    this.game = new Game()
    this.scene = new THREE.Scene()
    this.cubeTest = new CubeTest()
    this.floor = new Floor()

   this.scene.add(this.cubeTest.box) 
    this.scene.add(this.floor.floorMesh)
  }
}

export default World