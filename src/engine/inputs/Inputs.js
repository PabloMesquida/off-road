import Events from "../../core/Events"

class Inputs {
  constructor(_map) {
    this.events = new Events()
    this.map = _map || []
    this.keys = {}

    addEventListener("keydown", (e) => this.down(e.code))
    addEventListener("keyup", (e) => this.up(e.code))
  }

  // ==============================
  // Keyboard
  // ==============================
  down(key) {
    const map = this.map.find(m => Array.isArray(m.keys) && m.keys.includes(key))
    if (map && !this.keys[map.name]) {
      this.keys[map.name] = true
      this.events.trigger(map.name, [true])
    }
  }

  up(key) {
    const map = this.map.find(m => Array.isArray(m.keys) && m.keys.includes(key))
    if (map && this.keys[map.name]) {
      this.keys[map.name] = false
      this.events.trigger(map.name, [false])
    }
  }
}

export default Inputs
