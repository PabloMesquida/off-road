import Events from "./Events.js"


class Time{
  constructor(){
    this.events = new Events()
    this.start = Date.now() 
    this.current = this.start
    this.elapsed = 0
    this.delta = 5

  
  }

 

}

export default Time
