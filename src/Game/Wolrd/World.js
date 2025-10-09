import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'

class World{
  constructor(){
    this.game = new Game()
    this.scene = new THREE.Scene()
    this.events = new Events()
    this.environment = new Environment(this.scene)

    this.resources = this.game.resources
  
    this.floor = new Floor(this.scene, this.game.physics, { width: 100 , depth: 100, height: 0.2 }) 

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene,  this.game.physics)
    })

   }
}

export default World