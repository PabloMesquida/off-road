import Events from "../Utils/Events"

class Inputs {
  constructor(_map) {
    this.events = new Events()
    this.map = _map || []
    this.keys = {}
    // this.mouseButtons = {}
    // this.mousePos = { x: 0, y: 0 }
    // this.mouseDelta = { x: 0, y: 0 }
    // this._mouseTrackingEnabled = false

    // --- Keyboard ---
    addEventListener("keydown", (e) => this.down(e.code))
    addEventListener("keyup", (e) => this.up(e.code))

    // --- Mouse buttons ---
    // addEventListener("mousedown", (e) => this.mouseDown(e.button))
    // addEventListener("mouseup", (e) => this.mouseUp(e.button))
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

  // ==============================
  //  Mouse buttons
  // ==============================
  // mouseDown(button) {
  //   this.mouseButtons[button] = true
  //   console.log('click')
  //   this.events.trigger("mouseDown", [button])
  // }

  // mouseUp(button) {
  //   this.mouseButtons[button] = false
  //   this.events.trigger("mouseUp", [button])
  // }

  // ==============================
  //  Mouse movement 
  // ==============================
  // mouseMove = (event) => {
  //   this.mouseDelta.x = event.movementX || 0
  //   this.mouseDelta.y = event.movementY || 0
  //   this.mousePos.x = event.clientX
  //   this.mousePos.y = event.clientY
  //   this.events.trigger("mouseMove", [this.mouseDelta, this.mousePos])
  // }

  // enableMouseTracking() {
  //   if (this._mouseTrackingEnabled) return
  //   addEventListener("mousemove", this.mouseMove)
  //   this._mouseTrackingEnabled = true
  // }

  // disableMouseTracking() {
  //   if (!this._mouseTrackingEnabled) return
  //   removeEventListener("mousemove", this.mouseMove)
  //   this._mouseTrackingEnabled = false
  // }

  // ==============================
  //  Helper
  // ==============================
  // isDown(nameOrCode) {
  //   return this.keys[nameOrCode] || this.mouseButtons[nameOrCode]
  // }
}

export default Inputs
