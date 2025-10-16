import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from '../../Game.js'

class VehicleController {
  constructor(chassis, wheels) {
    this.game = new Game()
    this.physics = this.game.physics
    this.inputs = this.game.inputs  

    this.chassis = chassis
    this.wheels = wheels

    // constructor
    this.maxForwardSpeed = 20.0;   // m/s, ajustar a lo que quieras
    this.maxReverseSpeed = 6.0;    // m/s (velocidad máxima marcha atrás)
    this.speedLimitBrake = 200.0;  // torque de freno suave para reducir si ya superaste el límite

    this.controller = this.physics.world.createVehicleController(chassis.body)

    // parámetros de rueda
    const suspensionDir = new RAPIER.Vector3(0, -1, 0)
    const axle = new RAPIER.Vector3(0, 0, -1)
    const radius = 0.35

    wheels.forEach((wheel) => {
      const pos = wheel.position
      this.controller.addWheel(
        new RAPIER.Vector3(pos.x, pos.y, pos.z),
        suspensionDir,
        axle,
        0.35, // 0.125
        radius
      )
    })

    wheels.forEach((_, i) => {
      this.controller.setWheelSuspensionRestLength(i, 0.7);
      this.controller.setWheelMaxSuspensionTravel(i, 0.6);
      this.controller.setWheelSuspensionStiffness(i, 65); // N/m aproximado 55
      this.controller.setWheelSuspensionCompression(i, 3.0); // 4
      this.controller.setWheelSuspensionRelaxation(i, 3.0); // 2
      this.controller.setWheelMaxSuspensionForce(i,20000); // 20000

      // Fricción
      this.controller.setWheelFrictionSlip(i, 8.0)           // tracción normal
      this.controller.setWheelSideFrictionStiffness(i, 1)  // agarre lateral medio
    })

    // parámetros de control
    this.accelerateForce = 25.0
    this.brakeForce = 100.0
    this.steerAngleMax = Math.PI / 6
  }

  //   const forwardSpeed = -linVel.x; 
  //   let brakeFactor = wantBrake ? 0.05 : 0.0;

update(dt) {
  if (!this.controller) return;

  // ---------- inputs ----------
  const fwd = !!this.inputs.keys['forward'];
  const back = !!this.inputs.keys['backward'];
  const left = !!this.inputs.keys['left'];
  const right = !!this.inputs.keys['right'];
  const brk = !!this.inputs.keys['brake'];

  const throttle = Number(fwd) - Number(back); // 1, 0 ó -1
  const wantBrake = brk;

  // ---------- obtener velocidad en mundo ----------
  const lin = this.chassis.body.linvel();
  const vel = new THREE.Vector3(lin.x, lin.y, lin.z);

  // ---------- calcular vector "forward" del chasis (usando rotación del cuerpo) ----------
  const r = this.chassis.body.rotation(); // {x,y,z,w}
  const chassisQuat = new THREE.Quaternion(r.x, r.y, r.z, r.w);
  // Asumimos que el eje local X del modelo es "adelante". Si tu modelo usa -X, usa ( -1,0,0 ).
  const localForward = new THREE.Vector3(-1, 0, 0);
  const forwardVec = localForward.applyQuaternion(chassisQuat).normalize();

  // velocidad a lo largo del forwardVec: positiva = en sentido "forwardVec"
  const forwardSpeed = vel.dot(forwardVec); // en m/s (puede ser negativo dependiendo convención)

  // ---------- límites: comprobar si intentan acelerar más allá ----------
  // determinamos la intención de conducción: cuando throttle != 0 indica dirección deseada
  const desiredDir = Math.sign(throttle); // 1 => adelante, -1 => atrás, 0 => sin throttle

  // flags que indican si ya estamos por encima del limite en esa dirección
  const overForwardLimit = forwardSpeed > this.maxForwardSpeed;
  const overReverseLimit = forwardSpeed < -this.maxReverseSpeed; // note: reverse speed is negative along forwardVec

  // ---------- motor: calcular engineTarget (sin aplicarlo todavía) ----------
  let engineTarget = 0;
  if (throttle !== 0 && !wantBrake) {
    // Si están pidiendo acelerar:
    // - si quieren ir adelante y ya pasaron el limite -> no dar más motor
    if (desiredDir > 0 && overForwardLimit) {
      engineTarget = 0;
    // - si quieren ir atrás y ya pasaron limite reverse -> no dar más motor
    } else if (desiredDir < 0 && overReverseLimit) {
      engineTarget = 0;
    } else {
      engineTarget = throttle * this.accelerateForce;
    }
  } else {
    // sin throttle o freno: desaceleración natural (freno motor suave) pero solo si velocidad apreciable
    const eps = 0.05;
    if (Math.abs(forwardSpeed) > eps) {
      // desacelera proporcionalmente a la velocidad actual (constante de damping)
      engineTarget = -forwardSpeed * 5.0;
    } else {
      engineTarget = 0;
    }
  }

  // suavizado del motor
  this.currentForce = this.currentForce ?? 0;
  const smoothFactor = 10;
  this.currentForce = THREE.MathUtils.lerp(this.currentForce, engineTarget, 1 - Math.exp(-smoothFactor * dt));

  this.chassis.body.wakeUp();

  // ---------- direccion ----------
  const steerDir = Number(left) - Number(right);
  const currentSteer = this.controller.wheelSteering(0) || 0;
  const targetSteer = this.steerAngleMax * steerDir;
  const smoothSteer = THREE.MathUtils.lerp(currentSteer, targetSteer, 0.1);
  this.controller.setWheelSteering(0, smoothSteer);
  this.controller.setWheelSteering(1, smoothSteer);

  // ---------- freno (traseras) ----------
  // freno habitual (trasero derrapante)
  let brakeFactor = wantBrake ? 1 : 0.0;
  // reducir freno si vamos marcha atrás (según forwardSpeed signo)
  if (forwardSpeed < -0.01) brakeFactor *= 0.02; // ajusta según sensación

  const rearBrakeTorque = this.brakeForce * brakeFactor;

  // fricción y aplicar freno trasero
  this.controller.setWheelFrictionSlip(2, 1.5);
  this.controller.setWheelFrictionSlip(3, 1.5);
  this.controller.setWheelBrake(2, rearBrakeTorque);
  this.controller.setWheelBrake(3, rearBrakeTorque);

  // ---------- APLICAR LÍMITES ACTIVOS: si ya excedimos límites, ayudar a reducir ---------
  // Si estamos por encima del límite hacia adelante/atrás y no hay throttle en sentido contrario,
  // aplicamos un freno suave sobre las ruedas motrices para bajar la velocidad gradualmente.
  if (!wantBrake) {
    if (overForwardLimit && forwardSpeed > 0) {
      // sobre limite adelante: aplicar freno suave para reducir velocidad
      this.controller.setWheelBrake(2, Math.max(this.controller.wheelBrake(2) || 0, this.speedLimitBrake));
      this.controller.setWheelBrake(3, Math.max(this.controller.wheelBrake(3) || 0, this.speedLimitBrake));
    } else if (overReverseLimit && forwardSpeed < 0) {
      // sobre limite marcha atrás
      this.controller.setWheelBrake(2, Math.max(this.controller.wheelBrake(2) || 0, this.speedLimitBrake * 0.5));
      this.controller.setWheelBrake(3, Math.max(this.controller.wheelBrake(3) || 0, this.speedLimitBrake * 0.5));
    }
  }

  // ---------- APLICAR engineForce FINAL (siempre al final para evitar re-aplicaciones) ----------
  // Si frenas, motor 0; si no, aplicamos this.currentForce (que respetó el límite más arriba).
  if (wantBrake) {
    this.controller.setWheelEngineForce(2, 0);
    this.controller.setWheelEngineForce(3, 0);
    this.currentForce = 0;
  } else {
    this.controller.setWheelEngineForce(2, this.currentForce);
    this.controller.setWheelEngineForce(3, this.currentForce);
  }

  // ---------- avanzar la simulación ----------
  this.controller.updateVehicle(dt);

  // ---------- DEBUG (opcional) ----------
  if (this.debugCounter === undefined) this.debugCounter = 0;
  if ((this.debugCounter++ % 30) === 0) {
    console.log(
      `fwdSpeed=${forwardSpeed.toFixed(2)}m/s  maxF=${this.maxForwardSpeed}  maxR=${this.maxReverseSpeed}  engine=${this.currentForce.toFixed(1)}  rearBrake=${rearBrakeTorque.toFixed(1)}`
    );
  }
}







  syncMeshes() {
    // chasis
    const t = this.chassis.body.translation()
    const r = this.chassis.body.rotation()
    this.chassis.mesh.position.copy(new THREE.Vector3(t.x, t.y, t.z))
    this.chassis.mesh.quaternion.copy(new THREE.Quaternion(r.x, r.y, r.z, r.w))

    // ruedas
    this.wheels.forEach((wheel, i) => {
      wheel.update(this.controller, i)
    })
  }
}

export default VehicleController
