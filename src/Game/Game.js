import View from "./View/View.js"
import Viewport from "./Utils/Viewport.js"
import World from "./Wolrd/World.js"
import Time from "./Utils/Time.js"
import Rendering from "./Rendering/Rendering.js"

class Game{
  constructor(){
    // Singleton
    if(Game.instance) return Game.instance

    Game.instance = this

    this.domElement = document.querySelector('.game')

    // this.debug = new Debug()
    // this.inputs = new Inputs([
    //   { name: 'forward', keys: [ 'ArrowUp', 'KeyW']},
    //   { name: 'right', keys: [ 'ArrowRight', 'KeyD']},
    //   { name: 'backward', keys: [ 'ArrowDown', 'KeyS']},
    //   { name: 'left', keys: [ 'ArrowLeft', 'KeyA']},
    // ])
    this.time = new Time()
    this.viewport = new Viewport(this.domElement)
    // this.physics = new Physics()
    this.world = new World()
    // this.physicsDebug = new PhysicsDebug()
    this.view = new View()
    this.rendering = new Rendering()
    // this.vehicle = new Vehicle() 

/*     this.time.events.on('tick', () => {
      this.update()
    }) */
  }
  
}

export default Game