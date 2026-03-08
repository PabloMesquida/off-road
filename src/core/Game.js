import sources from "../sources.js"
import Viewport from "./Viewport.js"
import Resources from "./Resources.js"
import Rendering from "../engine/rendering/Rendering.js"
import View from "../engine/view/View.js"
import Physics from "../engine/physics/Physics.js"
// import PhysicsDebug from "../engine/physics/PhysicsDebug.js"
import Inputs from "../engine/inputs/Inputs.js"
import World from "../gameplay/world/World.js"
import Recorder from "../utils/Recorder.js"
import DebugUI from "../editor/UI/DebugUI.js"
 
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

    this.debugUI = new DebugUI({ title: 'Edit Panel' })
    
    this.inputs = new Inputs([
      { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
      { name: 'right', keys: ['ArrowRight', 'KeyD'] },
      { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
      { name: 'left', keys: [ 'ArrowLeft', 'KeyA']},
      { name: 'brake', keys: [ 'Space'] },
      { name: 'lights', keys: ['KeyL']},
      { name: 'hazard', keys: ['KeyB'] }, 
      { name: 'delete', keys: ['KeyX'] },
    ])

    this.world = null
    this.physicsDebug = null
    this.view = null
    this.rendering = null
  }

  async start() {
    await this.physics.ready

    this.world = new World(this)    
    this.view = new View()     
    // this.physicsDebug = new PhysicsDebug()

    this.rendering = new Rendering()
    this.world.toggleEditMode(this.world.isEditing)
  }

  updateAll(dt){
    // this.physicsDebug.update()
    this.view.update(dt)
  }

  updatePhysics(dt) {
    this.world.editorSystem?.update()
    this.world.vehicleSystem?.updatePhysics(dt)
  }
}

export default Game
