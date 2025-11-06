import View from "./View/View.js"
import Viewport from "./Utils/Viewport.js"
import World from "./World/World.js"
import Rendering from "./Rendering/Rendering.js"
import Physics from "./Physics/Physics.js"
import PhysicsDebug from "./Physics/PhysicsDebug.js"
import Inputs from "./Inputs/Inputs.js"
import sources from './sources.js'
import Resources from "./Utils/Resources.js"
import Recorder from "./Utils/Recorder.js"
import { Pane } from "tweakpane"
 
class Game{
  constructor(){
    if(Game.instance) return Game.instance

    Game.instance = this

    this.domElement = document.querySelector('.game')

    this.viewport = new Viewport(this.domElement)
    this.physics = new Physics()
    this.resources = new Resources(sources)

    this.recording = false
    this.mediaRecorder
    this.recordedChunks = []
    this.recorder = new Recorder(this.domElement, '#recordBtn')

    this.pane = new Pane({ title: 'Edit Panel' });
    
    this.inputs = new Inputs([
      { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
      { name: 'right', keys: ['ArrowRight', 'KeyD'] },
      { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
      { name: 'left', keys: [ 'ArrowLeft', 'KeyA']},
      { name: 'brake', keys: [ 'Space'] },
      { name: 'lights', keys: ['KeyL']},
      { name: 'hazard', keys: ['KeyB'] }, 
    ])

    this.world = null
    this.physicsDebug = null
    this.view = null
    this.rendering = null
  }

  async start() {
    await this.physics.ready
    this.world = new World()         
    // this.physicsDebug = new PhysicsDebug()
    this.view = new View()
    this.rendering = new Rendering()
  }

  updateAll(dt){
    // this.physicsDebug.update()
    this.view.update(dt)
  }

  updatePhysics(dt) {
    if (this.world.vehicle.visuals) {
      this.world.vehicle.visuals.update(dt)
      this.world.update()
    
    }
    const safeDt = Math.min(dt, 1 / 60)
    this.physics.world.timestep = safeDt

    if (this.world.vehicle.controller) {
      this.world.vehicle.controller.update(safeDt)
    }

    this.physics.world.step()

    if (this.world.vehicle.controller) {
      this.world.vehicle.controller.syncMeshes()
    }

    this.physics.syncEntities()
  }
}

export default Game