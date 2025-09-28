import * as THREE from 'three/webgpu'
import Game from '../Game.js'


class Rendering
{
  constructor(){
    this.game = new Game()

    this.clock = new THREE.Clock()

    this.fixedTimeStep = 1 / 60 // 60Hz
    this.accumulator = 0

    this.canvas = this.game.viewport.canvas
    this.sizes = this.game.viewport.sizes
    this.ratio = this.game.viewport.ratio
    this.scene = this.game.world.scene
    this.camera = this.game.view.camera
    

    this.setInstance()

    this.startLoop()   
        
    this.game.viewport.events.on('change', () => {
      this.resize()
    })
        
  }

  setInstance(){
    // this.instance = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true }) 
    this.instance = new THREE.WebGPURenderer({ canvas: this.canvas, antialias: true }) 

    this.instance.toneMapping = THREE.CineonToneMapping
    this.instance.toneMappingExposure = 1.75
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap
    this.instance.setClearColor('#010101')
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.ratio)
  }

  resize(){
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.ratio)
  }


startLoop() {
  this.instance.setAnimationLoop(async () => {
    const delta = this.clock.getDelta()
    this.accumulator += delta

    while (this.accumulator >= this.fixedTimeStep) {
      this.game.updatePhysics(this.fixedTimeStep)
      this.accumulator -= this.fixedTimeStep
    }

    this.game.updateAll() 

   this.instance.render(this.scene, this.camera)
  })

  }

  // Para grabar un video frame a frame
  // async render() {
  //   await this.instance.render(this.scene, this.camera)
  // } 
}

export default Rendering