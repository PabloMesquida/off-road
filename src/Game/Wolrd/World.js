import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'

class World{
  constructor(){
    this.game = new Game()
    this.scene = new THREE.Scene()
    this.vehicle = new Vehicle(this.scene,  this.game.physics)
    this.floor = new Floor(this.scene, this.game.physics, { width: 100 , depth: 100, height: 0.2 }) 
   }
}

export default World