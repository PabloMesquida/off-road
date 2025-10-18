import View from "./View/View.js"
import Viewport from "./Utils/Viewport.js"
import World from "./Wolrd/World.js"
import Rendering from "./Rendering/Rendering.js"
import Physics from "./Physics/Physics.js"
// import PhysicsDebug from "./Physics/PhysicsDebug.js"
import Inputs from "./Inputs/Inputs.js"
import sources from './sources.js'
import Resources from "./Utils/Resources.js"
 
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
    this.recordBtn = document.getElementById('recordBtn')

    this.recordBtn.addEventListener('click', () => {
    if (!this.recording) {
      this.startRecording()
      this.recordBtn.textContent = "🛑 Detener"
    } else {
      this.stopRecording()
      this.recordBtn.textContent = "🎬 Grabar"
    }
    this.recording = !this.recording
  }) 

    
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
    this.view.update()
    this.world.vehicle.visuals.update(dt)
  }

  updatePhysics(dt) {
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

  startRecording() {
    const stream =  this.domElement.captureStream(60) // 🔹 60 FPS suaves
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9', // buena calidad
      videoBitsPerSecond: 12000000 // 8 Mbps, ajusta según tu GPU
    })

    this.recordedChunks = []
    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.recordedChunks.push(e.data)
    }

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'threejs_recording.webm'
      a.click()

      URL.revokeObjectURL(url)
    }

    this.mediaRecorder.start()
    console.log("🎥 Grabación iniciada...")
  }

  // === DETENER GRABACIÓN ===
 stopRecording() {
  this.mediaRecorder.stop()
  console.log("🛑 Grabación detenida.")
}

// === BOTÓN DE CONTROL ===



}

export default Game