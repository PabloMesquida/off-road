import * as THREE from 'three'
import View from "./View/View.js"
import Viewport from "./Utils/Viewport.js"
import World from "./Wolrd/World.js"
// import Time from "./Utils/Time.js"
import Rendering from "./Rendering/Rendering.js"
import Physics from "./Physics/Physics.js"
import PhysicsDebug from "./Physics/PhysicsDebug.js"
import Inputs from "./Inputs/Inputs.js"
 
class Game{
  constructor(){
    // Singleton
    if(Game.instance) return Game.instance

    Game.instance = this

    this.domElement = document.querySelector('.game')
   // this.time = new Time()
    this.viewport = new Viewport(this.domElement)
    this.physics = new Physics()
    
    this.inputs = new Inputs([
      { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
      { name: 'right', keys: ['ArrowRight', 'KeyD'] },
      { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
      { name: 'left', keys: [ 'ArrowLeft', 'KeyA']}
    ])

    this.world = null
    this.physicsDebug = null
    this.view = null
    this.rendering = null

  }

  async start() {
    await this.physics.ready
 
    this.world = new World()         
    this.physicsDebug = new PhysicsDebug()
    this.view = new View()
    this.rendering = new Rendering()
  }

  updateAll(){
    this.physicsDebug.update()
    this.view.update()
  }

  updatePhysics(dt) {
    const safeDt = Math.min(dt, 1/60)
      this.physics.world.timestep =  Math.min(dt, 1/60) // Math.min(delta, 0.1)
      this.physics.world.step()


  // actualizar vehículo antes de step
  if (this.world.vehicle.controller) {
     this.world.vehicle.controller.update(safeDt)
  }

  // avanzar el mundo
  this.physics.world.step()

  // sincronizar vehículo después de step
  if (this.world.vehicle.controller) {
     this.world.vehicle.controller.syncMeshes()
  }

  // sincronizar entidades físicas con sus visuales
  this.physics.syncEntities()
}
}

export default Game