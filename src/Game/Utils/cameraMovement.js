// src/utils/cameraMovement.js
export default function updateCameraOrbit(state, camera, controls, opts = {}) {
  const TWO_PI = Math.PI * 2;

  // --- valores por defecto en caso de que no estén inicializados en el state ---
  state.angle = (typeof state.angle === 'number') ? state.angle : 0;
  state.radius = (typeof state.radius === 'number') ? state.radius : 14;
  state.speed = (typeof state.speed === 'number') ? state.speed : 0.001;
  state.targetSpeed = (typeof state.targetSpeed === 'number') ? state.targetSpeed : 0.01;
  state.height = (typeof state.height === 'number') ? state.height : 2;

  // opciones por defecto (puedes sobreescribirlas al llamar)
  const {
    minSpeed   = 0.002,
    maxSpeed   = 0.04,
    lerpFactor = 0.08,
    slowZone   = 0.25,  // radio angular (radianes) alrededor de 0 y π
    slowFactor = 0.35,  // multiplicador en el centro de la zona (0 = parado, 1 = sin efecto)
    targetY    = 0.5
  } = opts;

  // Normalizar ángulo a [0, 2π)
  let modAngle = ((state.angle % TWO_PI) + TWO_PI) % TWO_PI;

  // baseFactor: 0 en 0 y π, 1 en π/2 y 3π/2 (sin^2)
  const baseFactor = Math.pow(Math.sin(modAngle), 2);

  // velocidad objetivo base entre min y max
  let baseTarget = minSpeed + (maxSpeed - minSpeed) * baseFactor;

  // distancia angular al frente (0) o a la espalda (π)
  const distTo0 = Math.min(modAngle, TWO_PI - modAngle);
  const distToPi = Math.abs(modAngle - Math.PI);
  const minDist = Math.min(distTo0, distToPi);

  // si estamos dentro de slowZone, aplicamos una atenuación suave (smoothstep)
  let attenuation = 1.0;
  if (minDist < slowZone) {
    let t = 1 - (minDist / slowZone); // 0 en borde, 1 en centro
    let ease = t * t * (3 - 2 * t);   // smoothstep
    attenuation = 1 - (1 - slowFactor) * ease; // 1 en borde, slowFactor en centro
  }

  // target final (no menor que minSpeed)
  state.targetSpeed = Math.max(minSpeed, baseTarget * attenuation);

  // Lerp/interpolación suave hacia targetSpeed
  state.speed += (state.targetSpeed - state.speed) * lerpFactor;

  // Actualizamos ángulo (si quieres independiente del framerate, usa deltaTime)
  state.angle += state.speed;

  // Posicionamos la cámara en la órbita
  camera.position.x = Math.cos(state.angle) * state.radius;
  camera.position.z = Math.sin(state.angle) * state.radius;
  camera.position.y = state.height;

  // Mirar al target (y configurable)
  controls.target.set(0, targetY, 0);
  controls.update();
}
