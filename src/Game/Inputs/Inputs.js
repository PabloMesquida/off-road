import Events from "../Utils/Events"

class Inputs{
  constructor(_map){
    this.events = new Events()
    this.map = _map || []
    this.keys = {}  
     
    addEventListener('keydown', (_event) => {
      this.down(_event.code)
    })

    addEventListener('keyup', (_event) => {
      this.up(_event.code)
    })
  }

  down(key){
    // const map = this.map.find((_map) => _map.keys.indexOf(key) !== -1)
    const map = this.map.find(m => Array.isArray(m.keys) && m.keys.includes(key))

    if(map && !this.keys[map.name]){
      this.keys[map.name] = true
      this.events.trigger(map.name, [true])
    }
  }

  up(key){
   // const map = this.map.find((_map) => _map.keys.indexOf(key) !== -1)
    const map = this.map.find(m => Array.isArray(m.keys) && m.keys.includes(key))
    
    if(map && this.keys[map.name]){
      this.keys[map.name] = false
      this.events.trigger(map.name, [false])
    }
  }
}

export default Inputs