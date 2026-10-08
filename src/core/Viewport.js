import Events from "./Events.js"

class Viewport{
  constructor(canvas){
    this.canvas = canvas
    this.events = new Events()

    this.sizes = {}

    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight
    this.ratio = Math.min(window.devicePixelRatio, 2)

    this.setResize()
  }

  setResize(){
    window.addEventListener('resize', () => {
      // Ventana oculta/minimizada: conservar el último tamaño válido (un canvas 0x0 es inválido en WebGPU)
      if (window.innerWidth === 0 || window.innerHeight === 0) return

      this.sizes.width = window.innerWidth
      this.sizes.height = window.innerHeight
      this.ratio = Math.min(window.devicePixelRatio, 2) 

      this.events.trigger('change')
    })
  }
}

export default Viewport
