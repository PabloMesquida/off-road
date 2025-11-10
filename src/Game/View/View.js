import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

class View {
  constructor() {
    this.game = new Game();

    this.camera = new THREE.PerspectiveCamera(
      25,
      this.game.viewport.sizes.width / this.game.viewport.sizes.height,
      0.1,
      1000
    );

    // ✅ POSICIÓN Y ORIENTACIÓN INICIAL DE LA CÁMARA
    this.initialCamPos = new THREE.Vector3(20, 25, 20);
    this.initialCamTarget = new THREE.Vector3(0, 1.5, 0);

    this.camera.position.copy(this.initialCamPos);
    this.camera.lookAt(this.initialCamTarget);

    // Agregar a la escena
    this.game.world.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.game.domElement);
    this.controls.enableDamping = true;
    this.controls.enabled = false;

    // --- Parámetros de cámara ---
    this.offset = new THREE.Vector3(20, 25, 20);
    this.lerpSpeed = 3.5;

    // --- Estado ---
    this.isEditing = false;
    this.editCamTarget = this.initialCamTarget.clone();
    this.targetCamPos = this.initialCamPos.clone();

    this.dragging = false;
    this.prevMouse = new THREE.Vector2();
    this.panSpeed = 0.02;
    this.zoomSpeed = 2.0;

    // --- Transiciones ---
    this.transitioningToEdit = false;
    this.transitioningFromEdit = false;
    this.transitionTime = 0;
    this.editTransitionDuration = 0.7;

    // Listeners
    const dom = this.game.domElement;
    dom.addEventListener('mousedown', (e) => this.onMouseDown(e));
    dom.addEventListener('mousemove', (e) => this.onMouseMove(e));
    dom.addEventListener('mouseup', (e) => this.onMouseUp(e));
    dom.addEventListener('wheel', (e) => this.onWheel(e));
    dom.addEventListener('mouseleave', () => this.onMouseLeave());

    this.game.viewport.events.on('change', () => this.resize());
  }

  resize() {
    this.camera.aspect = this.game.viewport.sizes.width / this.game.viewport.sizes.height;
    this.camera.updateProjectionMatrix();
  }

  // ================================
  //   MODO EDICIÓN ON/OFF
  // ================================
  setEditMode(active) {
    console.log("View - Edit mode:", active);

    if (active) {
      // --- ENTRAR AL MODO EDICIÓN ---
      this.transitioningToEdit = true;
      this.transitioningFromEdit = false;
      this.transitionTime = 0;

      // Guardar posición/dirección actual
      this.startCamPos = this.camera.position.clone();
      this.startCamTarget = new THREE.Vector3();
      this.camera.getWorldDirection(this.startCamTarget);
      this.startCamTarget.add(this.camera.position);

      // Destino de la transición
      this.endCamPos = this.initialCamPos.clone();
      this.endCamTarget = this.initialCamTarget.clone();
    } else {
      // --- SALIR DEL MODO EDICIÓN ---
      this.transitioningToEdit = false;
      this.transitioningFromEdit = true;
      this.transitionTime = 0;

      // Resetear estado de arrastre
      this.dragging = false;

      // Guardar punto de partida (desde edición)
      this.startCamPos = this.camera.position.clone();
      this.startCamTarget = this.editCamTarget.clone();

      // Calcular destino (posición del vehículo)
      const vehicle = this.game.world.vehicle;
      if (vehicle && vehicle.chassis) {
        const body = vehicle.chassis.body;
        const pos = body.translation();
        const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        this.endCamPos = carPos.clone().add(this.offset);
        this.endCamTarget = carPos.clone().add(new THREE.Vector3(0, 1, 0));
      } else {
        this.endCamPos = this.initialCamPos.clone();
        this.endCamTarget = this.initialCamTarget.clone();
      }
    }
  }

  // ================================
  //  EVENTOS DE MOUSE PARA MOVER
  // ================================
  onMouseDown(e) {
    // No hacer nada si estamos colocando conos o arrastrando un asset
    if (this.game.world.isPlacingCone || this.game.world.isDraggingAsset) return;
    
    if (!this.isEditing) return;
    
    if (e.button === 0 || e.button === 1) {
      this.dragging = true;
      this.prevMouse.set(e.clientX, e.clientY);
      // El cursor ahora se maneja centralmente en World
      e.preventDefault();
    }
  }

  onMouseMove(e) {
    // No hacer nada si estamos colocando conos o arrastrando un asset
    if (this.game.world.isPlacingCone || this.game.world.isDraggingAsset) return;
    
    if (!this.isEditing || !this.dragging) return;

    // Lógica de movimiento de cámara
    const deltaX = e.clientX - this.prevMouse.x;
    const deltaY = e.clientY - this.prevMouse.y;
    this.prevMouse.set(e.clientX, e.clientY);

    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(this.camera.up, cameraDir);
    cameraRight.normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(cameraRight, deltaX * this.panSpeed);
    move.addScaledVector(cameraDir, deltaY * this.panSpeed);

    this.targetCamPos.add(move);
    this.editCamTarget.add(move);
  }

  onMouseUp(e) {
    // No hacer nada si estamos colocando conos o arrastrando un asset
    if (this.game.world.isPlacingCone || this.game.world.isDraggingAsset) return;
    
    if (!this.isEditing) return;
    
    if (e.button === 0 || e.button === 1) {
      this.dragging = false;
    }
  }

  onMouseLeave() {
    // Si el mouse sale del canvas, resetear estado de arrastre
    if (this.dragging) {
      this.dragging = false;
    }
  }

  onWheel(e) {
    // No hacer zoom si estamos colocando conos o arrastrando un asset
    if (this.game.world.isPlacingCone || this.game.world.isDraggingAsset) return;
    
    if (!this.isEditing) return;
    
    const delta = e.deltaY > 0 ? 1 : -1;
    this.targetCamPos.y += delta * this.zoomSpeed;
    this.targetCamPos.y = Math.max(5, Math.min(50, this.targetCamPos.y));
    e.preventDefault();
  }

  // ================================
  //   UPDATE PRINCIPAL
  // ================================
  update(dt) {
    const vehicle = this.game.world.vehicle;
    if (!vehicle || !vehicle.chassis) return;

    const body = vehicle.chassis.body;
    const pos = body.translation();
    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    // --- Transición hacia modo edición ---
    if (this.transitioningToEdit) {
      this.transitionTime += dt;
      const t = Math.min(this.transitionTime / this.editTransitionDuration, 1);
      const smoothT = t * t * (3 - 2 * t);

      this.camera.position.lerpVectors(this.startCamPos, this.endCamPos, smoothT);
      const currentTarget = new THREE.Vector3().lerpVectors(this.startCamTarget, this.endCamTarget, smoothT);
      this.camera.lookAt(currentTarget);

      if (t >= 1) {
        this.transitioningToEdit = false;
        this.isEditing = true;
        this.targetCamPos.copy(this.endCamPos);
        this.editCamTarget.copy(this.endCamTarget);
      }
      return;
    }

    // --- Transición desde modo edición ---
    if (this.transitioningFromEdit) {
      this.transitionTime += dt;
      const t = Math.min(this.transitionTime / this.editTransitionDuration, 1);
      const smoothT = t * t * (3 - 2 * t);

      this.camera.position.lerpVectors(this.startCamPos, this.endCamPos, smoothT);
      const currentTarget = new THREE.Vector3().lerpVectors(this.startCamTarget, this.endCamTarget, smoothT);
      this.camera.lookAt(currentTarget);

      if (t >= 1) {
        this.transitioningFromEdit = false;
        this.isEditing = false;
      }
      return;
    }

    // --- Modo edición activo ---
    if (this.isEditing) {
      this.camera.position.lerp(this.targetCamPos, 1 - Math.exp(-4 * dt));
      this.camera.lookAt(this.editCamTarget);
      return;
    }

    // --- Seguimiento normal ---
    const desiredCamPos = carPos.clone().add(this.offset);
    this.camera.position.lerp(desiredCamPos, 1 - Math.exp(-this.lerpSpeed * dt));
    const lookAtPos = carPos.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.camera.lookAt(lookAtPos);
  }
}

export default View;