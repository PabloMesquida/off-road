// Ajusta el pixel ratio según los FPS medidos: baja la resolución interna cuando el frame
// no llega al objetivo y la vuelve a subir cuando hay margen. El costo de casi todo el frame
// (escena, MSAA, bloom) escala con la cantidad de píxeles, así que es la palanca más efectiva.
class AdaptiveResolution {
  constructor({
    min = 1,
    max = 2,
    step = 0.25,
    targetFps = 55,     // por encima de esto se considera que sobra margen
    lowFps = 50,        // por debajo de esto se baja la resolución
    sampleTime = 1,     // segundos por medición
    warmup = 3          // ignorar los primeros segundos (compilación de shaders, carga)
  } = {}) {
    this.min = Math.min(min, max)
    this.max = max
    this.step = step
    this.targetFps = targetFps
    this.lowFps = lowFps
    this.sampleTime = sampleTime
    this.warmup = warmup

    this.ratio = max

    this._time = 0
    this._frames = 0
    this._elapsed = 0
    this._sinceChange = 0
    this._baseCooldown = 4
    this._cooldown = this._baseCooldown
  }

  // Nuevo máximo (resize / cambio de monitor)
  setMax(max) {
    this.max = max
    this.min = Math.min(this.min, max)
    this.ratio = Math.min(this.ratio, max)
  }

  // Devuelve true si el ratio cambió
  update(delta) {
    this._elapsed += delta
    if (this._elapsed < this.warmup) return false

    this._time += delta
    this._frames++
    if (this._time < this.sampleTime) return false

    const fps = this._frames / this._time
    this._sinceChange += this._time
    this._time = 0
    this._frames = 0

    if (fps < this.lowFps && this.ratio > this.min) {
      // Si hay que bajar poco después de haber subido, ese nivel no se sostiene:
      // esperar cada vez más antes de volver a intentarlo (evita oscilar).
      this._cooldown = this._sinceChange < this._cooldown * 2
        ? Math.min(this._cooldown * 2, 60)
        : this._baseCooldown

      this.ratio = Math.max(this.min, this.ratio - this.step)
      this._sinceChange = 0
      return true
    }

    if (fps >= this.targetFps && this.ratio < this.max && this._sinceChange >= this._cooldown) {
      this.ratio = Math.min(this.max, this.ratio + this.step)
      this._sinceChange = 0
      return true
    }

    return false
  }
}

export default AdaptiveResolution
