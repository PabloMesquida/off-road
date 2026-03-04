import Game from "../../../core/Game.js"

class VehicleVisuals {
  constructor(chassis) {
    this.game = new Game()
    this.inputs = this.game.inputs
    this.chassis = chassis

    this.lightsOn = false
    this.hazardOn = false
    this.hazardTimer = 0
    this.hazardBlink = false

    this.isOutsideLimit = false

    this.setupInputs()
  }

  setupInputs() {
    this.inputs.events.on('lights', (pressed) => {
      if (pressed) this.toggleLights()
    })

    this.inputs.events.on('hazard', (pressed) => {
      if (pressed) this.toggleHazards()
    })
  }

  toggleLights() {
    this.lightsOn = !this.lightsOn

    const frontLight = this.chassis.materials.frontLight
    if (this.lightsOn) {
      frontLight.turnOn()
    } else {
      frontLight.turnOff()
    }
  }

  toggleHazards() {
    this.hazardOn = !this.hazardOn
    this.hazardTimer = 0
    if (!this.hazardOn) {
      this.chassis.materials.sideLight.turnOff()
    }
  }

  update(dt) {
    // --- Balizas (intermitentes) ---
    if (this.hazardOn) {
      this.hazardTimer += dt
      const blink = Math.floor(this.hazardTimer * 2) % 2 === 0 

      if (blink !== this.hazardBlink) {
    
        this.hazardBlink = blink
        const sideLight = this.chassis.materials.sideLight
        if (blink) sideLight.turnOn()
        else sideLight.turnOff()
      }
    }

    // --- Freno ---
    const braking = !!this.inputs.keys['brake'] || this.isOutsideLimit
    const brakeLight = this.chassis.materials.brakeLight
    braking ? brakeLight.turnOn() : brakeLight.turnOff()

    // --- Reversa ---
    const backward = !!this.inputs.keys['backward']
    const reverseLight = this.chassis.materials.reverseLight
    backward ? reverseLight.turnOn() : reverseLight.turnOff()
  }
}

export default VehicleVisuals
