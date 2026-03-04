import * as THREE from 'three/webgpu'
import Game from '../../core/Game.js'

class PhysicsDebug{
  constructor(){
    this.game = new Game()
 
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 4))

    this.material = new THREE.LineBasicNodeMaterial()

    this.lineSegments = new THREE.LineSegments(this.geometry, this.material)
    this.game.world.scene.add(this.lineSegments)  
  }

  update() {
    if (!this.game.physics.world) return;

    const { vertices, colors } = this.game.physics.world.debugRender();

    // Verifica si el tamaño cambió
    const posAttr = this.geometry.getAttribute('position');
    const colAttr = this.geometry.getAttribute('color');

    const needNewPosition = !posAttr || posAttr.array.length !== vertices.length;
    const needNewColor = !colAttr || colAttr.array.length !== colors.length;

    if (needNewPosition) {
      this.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
      );
    } else {
      posAttr.array.set(vertices);
      posAttr.needsUpdate = true;
    }

    if (needNewColor) {
      this.geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 4)
      );
    } else {
      colAttr.array.set(colors);
      colAttr.needsUpdate = true;
    }

    this.geometry.computeBoundingSphere();
  }

} 

export default PhysicsDebug
