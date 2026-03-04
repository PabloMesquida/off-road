import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import Game from '../../core/Game.js'
import Stats from 'stats-gl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'

class Rendering
{
  constructor(){
    this.game = new Game()
    this.clock = new THREE.Clock()
    this.stats = new Stats({ trackGPU: true });
    this.fixedTimeStep = 1 /60 

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
  
    this.postProcessing = new THREE.PostProcessing(this.instance)

    // --- Render principal ---
    this.scenePass = TSL.pass(this.scene, this.camera)
    this.scenePassColor = this.scenePass.getTextureNode()

    // --- Bloom ---
    this.bloomPass = bloom(this.scenePassColor)
    this.bloomPass.strength.value = 1.2
    this.bloomPass.radius.value = 0.6
    this.bloomPass.threshold.value = 1.0 // sólo cosas muy brillantes

    // --- Combinar escena + bloom ---
    const finalImage = this.scenePassColor.add(this.bloomPass)

    // --- Salida final ---
    this.postProcessing.outputNode = finalImage

    this.stats.init( this.instance )
    document.body.appendChild(this.stats.dom)

    this.instance.toneMapping = THREE.CineonToneMapping
    this.instance.toneMappingExposure = 1.2 // 1.75
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.VSMShadowMap          
    
    this.instance.setClearColor('#222') // 141414
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.ratio)
  }

  resize() {
    const width = Math.floor(this.sizes.width * this.ratio)
    const height = Math.floor(this.sizes.height * this.ratio)

    this.instance.setSize(width, height);
    this.instance.setPixelRatio(this.ratio);

    // 🔄 Reconstruir nodos post-procesado
    if (this.postProcessing) {
      this.postProcessing.dispose()

      // Volver a crear el pipeline
      this.postProcessing = new THREE.PostProcessing(this.instance)

      const scenePass = TSL.pass(this.scene, this.camera)
      const scenePassColor = scenePass.getTextureNode()

      const bloomPass = bloom(scenePassColor)
      bloomPass.strength.value = 1.2
      bloomPass.radius.value = 0.6
      bloomPass.threshold.value = 1.0

      const finalImage = scenePassColor.add(bloomPass)
      this.postProcessing.outputNode = finalImage
    }
  }

 startLoop() {
    const fixedDelta = 1 / 60
    let accumulator = 0

    // estrategia: await cada N frames para equilibrar precisión y rendimiento
    const AWAIT_EVERY_N_FRAMES = 30
    let frameCount = 0

    this.instance.setAnimationLoop( async () => {
      const delta = this.clock.getDelta()
      const clampedDelta = Math.min(delta, 0.1)
      accumulator += clampedDelta

      while (accumulator >= fixedDelta) {
        this.game.updatePhysics(fixedDelta)
        accumulator -= fixedDelta
      }

      this.game.updateAll(fixedDelta)

      frameCount++

      try {
        const renderPromise = this.instance.renderAsync(this.scene, this.camera)
          this.postProcessing.render()
       if (frameCount % AWAIT_EVERY_N_FRAMES === 0) {
          // sincronizamos de vez en cuando para mantener las timestamps bajo control
          await renderPromise;

          // después del await, resolvemos las timestamp queries (RENDER)
          // await aquí es razonable porque acabamos de await renderPromise
          await this.instance.resolveTimestampsAsync(THREE.TimestampQuery.RENDER);
        } else {
          // no bloquear cada frame: dejamos la promesa en vuelo y resolvemos timestamps sin await
          // capturamos errores para evitar promesas no manejadas
          renderPromise.catch((e) => {
            // opcional: console.warn('renderAsync (no-await) error', e);
          });

          this.instance.resolveTimestampsAsync(THREE.TimestampQuery.RENDER).catch(() => {
            // opcional: silenciar errores menores
          });
        }
      } catch (err) {
        // si algo falla en render/resolve, lo logueamos sin romper el loop
        console.error('Render/resolve error:', err)
      }     

      // actualizar stats después del render / encolado
      this.stats.update()
    });
  }
}

export default Rendering