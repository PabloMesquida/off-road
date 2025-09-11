import * as THREE from 'three'
import Game from '../Game.js'


class Rendering
{
  constructor(){
    this.game = new Game()

    this.canvas = this.game.viewport.canvas
    this.sizes = this.game.viewport.sizes
    this.ratio = this.game.viewport.ratio
    this.scene = this.game.world.scene
    this.camera = this.game.view.camera

    this.setInstance()

    this.game.time.events.on('tick', () => {
      this.render()
    })       
        
    this.game.viewport.events.on('change', () => {
      this.resize()
    })
        
  }

  setInstance(){
    this.instance = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
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

  render(){
    this.instance.render(this.scene, this.camera)
  }
}

export default Rendering