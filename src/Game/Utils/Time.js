import Events from "./Events"


class Time{
  constructor(){
    this.events = new Events()
    this.start = Date.now() 
    this.current = this.start
    this.elapsed = 0
    this.delta = 5

    window.requestAnimationFrame(() => { 
      this.tick()
    })
  }

  tick(){
    const currentTime = Date.now()
    this.delta = currentTime - this.current
    this.deltaScaled = this.delta * 0.001
    this.current = currentTime
    this.elapsed = this.current - this.start

    this.events.trigger('tick')

    window.requestAnimationFrame(() => { 
      this.tick()
    })
  }

}

export default Time
