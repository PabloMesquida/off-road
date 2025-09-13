import View from "./View/View.js"
import Viewport from "./Utils/Viewport.js"
import World from "./Wolrd/World.js"
import Time from "./Utils/Time.js"
import Rendering from "./Rendering/Rendering.js"
import Physics from "./Physics/Physics.js"
import PhysicsDebug from "./Physics/PhysicsDebug.js"
 


class Game{
  constructor(){
    // Singleton
    if(Game.instance) return Game.instance

    Game.instance = this

    this.domElement = document.querySelector('.game')
    this.time = new Time()
    this.viewport = new Viewport(this.domElement)
    this.physics = new Physics()
    this.world = new World()
    this.physicsDebug = new PhysicsDebug() 
    this.view = new View()
    this.rendering = new Rendering() 

    // this.world.scene.add(this.physicsDebug.lineSegments) 
    // console.log(this.physicsDebug.lineSegments)

  }
  
}

export default Game