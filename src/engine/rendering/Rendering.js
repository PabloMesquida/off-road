import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'
import Game from '../../core/Game.js'
import AdaptiveResolution from './AdaptiveResolution.js'
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'

// Inspector de three.js (contador de FPS y tiempos por pasada): desactivado por defecto,
// se activa agregando ?inspector a la URL. Activa las timestamp queries de GPU, que tienen su costo.
const USE_INSPECTOR = new URLSearchParams(location.search).has('inspector')

class Rendering
{
  constructor(){
    this.game = new Game()
    // Timer reemplaza a Clock (deprecado en r183); connect() evita un delta enorme al volver a la pestaña
    this.timer = new THREE.Timer()
    this.timer.connect(document)
    this.fixedTimeStep = 1 /60

    this.canvas = this.game.viewport.canvas
    this.sizes = this.game.viewport.sizes
    this.scene = this.game.world.scene
    this.camera = this.game.view.camera

    // Arranca con el ratio del dispositivo (máx. 2) y baja hasta 1 si los FPS no alcanzan
    this.adaptiveResolution = new AdaptiveResolution({ min: 1, max: this.game.viewport.ratio })

    this.setInstance()

    this.startLoop()

    this.game.viewport.events.on('change', () => {
      this.resize()
    })

  }

  setInstance(){
    // this.instance = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    // Sin MSAA en el canvas: solo recibe el quad final del renderPipeline (no tiene bordes que suavizar).
    // El antialiasing se aplica en el pass de la escena ({ samples: 4 } más abajo).
    this.instance = new THREE.WebGPURenderer({ canvas: this.canvas, antialias: false })

    if (USE_INSPECTOR) this.instance.inspector = new Inspector()

    // RenderPipeline es el nombre actual de PostProcessing (renombrado en r183)
    this.renderPipeline = new THREE.RenderPipeline(this.instance)

    // --- Render principal ---
    this.scenePass = TSL.pass(this.scene, this.camera, { samples: 4 })
    this.scenePassColor = this.scenePass.getTextureNode()

    // --- Bloom ---
    this.bloomPass = bloom(this.scenePassColor)
    this.bloomPass.strength.value = 1.2
    this.bloomPass.radius.value = 0.6
    this.bloomPass.threshold.value = 1.0 // sólo cosas muy brillantes

    // --- Combinar escena + bloom ---
    const finalImage = this.scenePassColor.add(this.bloomPass)

    // --- Salida final ---
    this.renderPipeline.outputNode = finalImage

    this.instance.toneMapping = THREE.CineonToneMapping
    this.instance.toneMappingExposure = 0.8 // 1.75
    this.instance.shadowMap.enabled = true
    // PCF (en r186 ya es suave: disco de Vogel escalado por shadow.radius). VSM costaba 2 pasadas
    // de blur extra sobre el shadow map completo cada frame, y además dibuja los receptores en el mapa.
    this.instance.shadowMap.type = THREE.PCFShadowMap

    this.instance.setClearColor('#222') // 141414
    this.instance.setPixelRatio(this.adaptiveResolution.ratio)
    this.instance.setSize(this.sizes.width, this.sizes.height)

    // El suelo procedural se hornea a textura una vez que hay renderer
    this.instance.init().then(() => this.game.world.floor.bakeMaterial(this.instance))
  }

  resize() {
    // setSize recibe el tamaño CSS: el renderer ya multiplica internamente por el pixel ratio.
    // El ratio máximo se lee del viewport porque puede cambiar (zoom, cambio de monitor).
    this.adaptiveResolution.setMax(this.game.viewport.ratio)
    this.instance.setPixelRatio(this.adaptiveResolution.ratio)
    this.instance.setSize(this.sizes.width, this.sizes.height)

    // No hace falta reconstruir el renderPipeline: PassNode y BloomNode
    // ajustan sus render targets al tamaño del renderer en cada frame.
  }

 startLoop() {
    const fixedDelta = 1 / 60
    let accumulator = 0

    this.instance.setAnimationLoop((time) => {
      this.timer.update(time)
      const delta = this.timer.getDelta()
      // Acotado en ambos sentidos: un delta negativo haría divergir los lerps exponenciales de la cámara
      const clampedDelta = Math.min(Math.max(delta, 0), 0.1)
      accumulator += clampedDelta

      if (this.adaptiveResolution.update(clampedDelta)) {
        this.instance.setPixelRatio(this.adaptiveResolution.ratio)
      }

      while (accumulator >= fixedDelta) {
        this.game.updatePhysics(fixedDelta)
        accumulator -= fixedDelta
      }

      // La física usa paso fijo; la cámara/visuales usan el tiempo real del frame
      this.game.updateAll(clampedDelta)

      // El scenePass del renderPipeline ya renderiza la escena (y las sombras):
      // no hace falta un renderer.render() aparte.
      this.renderPipeline.render()
    });
  }
}

export default Rendering
