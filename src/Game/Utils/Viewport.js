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
      this.sizes.width = window.innerWidth
      this.sizes.height = window.innerHeight
      this.ratio = Math.min(window.devicePixelRatio, 2) 

      this.events.trigger('change')
    })
  }
}

export default Viewport