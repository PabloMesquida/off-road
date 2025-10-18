import * as THREE from 'three/webgpu'
import Game from "../Game.js";
import { OrbitControls  } from 'three/examples/jsm/controls/OrbitControls.js'; 

class View{
  constructor(){
    this.game = new Game()

    this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.sizes.width / this.game.viewport.sizes.height, 0.1, 1000)
    
    this.radius = 14; // distancia desde el centro
    this.angle = 0;   // ángulo inicial
    this.speed = 0.001;          // velocidad actual
    this.targetSpeed = 0.01;    // velocidad deseada (lerpeada)
   
  this.camera.position.set(-10, 5, 10) // 10  10 20

    // Posición inicial de la cámara
    // this.camera.position.set(
    //   Math.cos(this.angle) * this.radius,
    //   2,
    //   Math.sin(this.angle) * this.radius
    // );

    this.game.world.scene.add(this.camera)

    this.controls = new OrbitControls(this.camera, this.game.domElement)
    this.controls.enableDamping = true

    this.game.viewport.events.on('change', () => { this.resize() })
  }

  resize(){
    this.camera.aspect = this.game.viewport.sizes.width / this.game.viewport.sizes.height
    this.camera.updateProjectionMatrix()
  }

  smoothStep(edge0, edge1, x) {
      x = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
      return x * x * (3 - 2 * x);
  }

update() {
    // const TWO_PI = Math.PI * 2;

    // // Normalizamos el ángulo a [0, 2π)
    // let modAngle = ((this.angle % TWO_PI) + TWO_PI) % TWO_PI;

    // // Parámetros ajustables
    // const minSpeed = 0.001;    // velocidad mínima (nunca se queda totalmente parado)
    // const maxSpeed = 0.04;     // velocidad máxima
    // const lerpFactor = 0.08;   // cuánto reacciona la velocidad al target (ajusta suavidad)
    // const slowZone = 0.25;     // radio angular (radianes) alrededor de 0 y π donde se aplica la reducción
    // const slowFactor = 0.35;   // cuánto se reduce (en el centro de la zona se multiplica la velocidad por este factor)

    // // factor base: 0 en 0 y π, 1 en π/2 y 3π/2
    // const baseFactor = Math.pow(Math.sin(modAngle), 2); // sin^2, simétrico

    // // velocidad objetivo base entre min y max
    // let baseTarget = minSpeed + (maxSpeed - minSpeed) * baseFactor;

    // // distancia angular al frente (0) o a la espalda (π)
    // const distTo0 = Math.min(modAngle, TWO_PI - modAngle);
    // const distToPi = Math.abs(modAngle - Math.PI);
    // const minDist = Math.min(distTo0, distToPi);

    // // Si estamos dentro de slowZone aplicamos una atenuación suave (smoothstep)
    // let attenuation = 1.0;
    // if (minDist < slowZone) {
    //     let t = 1 - (minDist / slowZone);      // 0 en borde, 1 en el centro (0 o π)
    //     // smoothstep
    //     let ease = t * t * (3 - 2 * t);
    //     // attenuation = 1 en borde, = slowFactor en centro
    //     attenuation = 1 - (1 - slowFactor) * ease;
    // }

    // // target final (no menor que minSpeed)
    // this.targetSpeed = Math.max(minSpeed, baseTarget * attenuation);

    // // Lerp / interpolación suave
    // this.speed += (this.targetSpeed - this.speed) * lerpFactor;

    // // Actualizamos ángulo y posición de cámara
    // this.angle += this.speed;
    // this.camera.position.x = Math.cos(this.angle) * this.radius;
    // this.camera.position.z = Math.sin(this.angle) * this.radius;

    // // Siempre mira al centro
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();
}


}

export default View