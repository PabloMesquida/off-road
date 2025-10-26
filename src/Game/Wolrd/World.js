import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import CubeTest from './CubeTest/CubeTest.js'

class World{
  constructor(){
    this.game = new Game()
    this.scene = new THREE.Scene()
    this.events = new Events()
  
    this.resources = this.game.resources
  
    this.floor = new Floor(this.scene, this.game.physics, { x: 120 , y: 0.2, z: 120}) 

    this.resources.events.on('ready', () => {
     
        this.vehicle = new Vehicle(this.scene, this.game.physics)

      this.environment = new Environment(this.scene)
     // this.cubeTest = new CubeTest(this.scene)
    })

   }
}

export default World