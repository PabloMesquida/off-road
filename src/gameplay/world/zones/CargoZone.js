import * as THREE from 'three'

class CargoZone {
  constructor({ scene, position = { x: 0, y: 0, z: 0 }, size = 4 }) {
    this.scene = scene
    this.size = size

    this.group = new THREE.Group()
    this.group.name = 'cargoZone'

    this.createVisual()

    this.setPosition(position)

    this.scene.add(this.group)

    // referencia útil para editor / picking
    this.group.userData.zone = this
    this.group.userData.type = 'cargoZone'
  }

  // ─────────────────────────────
  // Visual (cuadrado simple)
  // ─────────────────────────────

  createVisual() {
    const geo = new THREE.PlaneGeometry(this.size, this.size)

    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.02

    this.mesh = mesh
    this.group.add(mesh)

    // borde (opcional pero ayuda visual)
    const edges = new THREE.EdgesGeometry(geo)
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00ff88 })
    )
    line.rotation.x = -Math.PI / 2
    line.position.y = 0.021

    this.group.add(line)
  }

  // ─────────────────────────────
  // Posición
  // ─────────────────────────────

  setPosition({ x, y, z }) {
    this.group.position.set(x, y, z)
  }

  getPosition() {
    return this.group.position
  }

  // ─────────────────────────────
  // Bounds (lo vamos a usar después)
  // ─────────────────────────────

  getBounds() {
    const half = this.size * 0.5
    const pos = this.group.position

    return {
      xMin: pos.x - half,
      xMax: pos.x + half,
      zMin: pos.z - half,
      zMax: pos.z + half
    }
  }

  isInside(position) {
    const b = this.getBounds()
    return (
      position.x >= b.xMin &&
      position.x <= b.xMax &&
      position.z >= b.zMin &&
      position.z <= b.zMax
    )
  }

  // ─────────────────────────────
  // Limpieza
  // ─────────────────────────────

  dispose() {
    if (this.group && this.scene) {
      this.scene.remove(this.group)
    }

    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose()
        child.material?.dispose()
      }
    })
  }
}

export default CargoZone